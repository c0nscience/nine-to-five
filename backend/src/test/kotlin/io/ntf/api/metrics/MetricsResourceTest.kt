package io.ntf.api.metrics

import io.ntf.api.infrastructure.SecurityConfiguration
import io.ntf.api.metrics.model.MetricConfiguration
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf
import org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt
import org.springframework.test.web.reactive.server.WebTestClient
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.Duration
import java.time.LocalDate
import java.time.Month
import java.time.temporal.ChronoUnit.*
import java.util.*
import kotlin.time.ExperimentalTime

@WebFluxTest(value = [MetricsResource::class], excludeAutoConfiguration = [])
@Import(SecurityConfiguration::class)
class MetricsResourceTest {

  @Autowired
  lateinit var rest: WebTestClient

  @MockBean
  lateinit var metricsService: MetricsService

  @Test
  internal fun `should return all configured metrics for given user with read-metrics scope`() {
    val userId = "existing-user"
    val metricId = UUID.randomUUID().toString()

    `when`(metricsService.findAllByUserId(userId))
      .thenReturn(Flux.just(
        MetricConfiguration(
          id = metricId,
          userId = userId,
          name = "overtime",
          tags = listOf("some-tag"),
          timeUnit = WEEKS,
          formula = "sum",
          threshold = 40.0
        )
      ))

    rest.mutateWith(mockJwt().jwt { jwt -> jwt.claim("sub", userId).claim("scope", "read:metrics") })
      .get().uri("/metrics").exchange()
      .expectStatus().is2xxSuccessful
      .expectBody()
      .jsonPath("$.length()").isEqualTo(1)
      .jsonPath("$[0].id").isEqualTo(metricId)
      .jsonPath("$[0].name").isEqualTo("overtime")
  }

  @Test
  internal fun `should return forbidden for wrong scope for read all metric configurations`() {
    rest.mutateWith(mockJwt().jwt { jwt -> jwt.claim("scope", "not-existing-scope") })
      .get().uri("/metrics").exchange()
      .expectStatus().isForbidden
  }

  @Test
  internal fun `should save new metric configuration`() {
    val userId = "existing-user"

    `when`(metricsService.createMetricConfiguration(userId, CreateMetric(name = "Overtime", tags = listOf("some-tag"), formula = "sum", timeUnit = WEEKS, threshold = 40.0)))
      .thenReturn(Mono.just(
        MetricConfiguration(
          userId = userId,
          name = "overtime",
          tags = listOf("some-tag"),
          timeUnit = WEEKS,
          formula = "sum",
          threshold = 40.0
        )
      ))

    rest.mutateWith(mockJwt().jwt { jwt -> jwt.claim("sub", userId).claim("scope", "create:metrics") })
      .mutateWith(csrf())
      .post()
      .uri("/metrics")
      .contentType(MediaType.APPLICATION_JSON)
      .body(Mono.just("""{"name":"Overtime", "tags":["some-tag"], "formula":"sum","timeUnit":"WEEKS","threshold":40.0}"""), String::class.java)
      .exchange()
      .expectStatus().isCreated
      .expectBody().isEmpty

    verify(metricsService).createMetricConfiguration(userId, CreateMetric(name = "Overtime", tags = listOf("some-tag"), formula = "sum", timeUnit = WEEKS, threshold = 40.0))
  }

  @Test
  internal fun `should return forbidden for wrong scope for new metric configuration endpoint`() {
    val userId = "existing-user"

    rest.mutateWith(mockJwt().jwt { jwt -> jwt.claim("sub", userId).claim("scope", "not-existing") })
      .mutateWith(csrf())
      .post()
      .uri("/metrics")
      .contentType(MediaType.APPLICATION_JSON)
      .body(Mono.just("""{"name":"Overtime", "tags":["some-tag"], "formula":"sum","timeUnit":"WEEKS"}"""), String::class.java)
      .exchange()
      .expectStatus().isForbidden

    verifyNoInteractions(metricsService)
  }

  @ExperimentalTime
  @Test
  internal fun `should return a calculated metric for a metric configuration id`() {
    val userId = "existing-user"

    val metricConfigurationId = UUID.randomUUID().toString()
    `when`(metricsService.calculateMetricFor(userId, metricConfigurationId))
      .thenReturn(Mono.just(MetricDetail(
        id = metricConfigurationId,
        name = "Overtime",
        totalExceedingDuration = Duration.of(40, HOURS).plusMinutes(30),
        formula = "limited-sum",
        threshold = 40.0,
        values = listOf(MetricValue(
          duration = Duration.of(40, HOURS).plusMinutes(30),
          date = LocalDate.of(2020, Month.MAY, 12)
        ))
      )))

    rest.mutateWith(mockJwt().jwt { jwt -> jwt.claim("sub", userId).claim("scope", "read:metrics") })
      .get()
      .uri("/metrics/$metricConfigurationId")
      .exchange()
      .expectStatus().isOk
      .expectBody()
      .jsonPath("$.id").isEqualTo(metricConfigurationId)
      .jsonPath("$.name").isEqualTo("Overtime")
      .jsonPath("$.totalExceedingDuration").isEqualTo("PT40H30M")
      .jsonPath("$.formula").isEqualTo("limited-sum")
      .jsonPath("$.threshold").isEqualTo(40.0)
      .jsonPath("$.values[0].duration").isEqualTo("PT40H30M")
      .jsonPath("$.values[0].date").isEqualTo("2020-05-12")
  }

}
