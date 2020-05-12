package io.ntf.api.metrics

import io.ntf.api.infrastructure.SecurityConfiguration
import io.ntf.api.metrics.model.MetricConfiguration
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers
import org.mockito.ArgumentMatchers.anyString
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
import java.time.temporal.ChronoUnit
import java.util.*

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
      .thenReturn(Flux.just(MetricConfiguration(id = metricId, userId = userId)))

    rest.mutateWith(mockJwt().jwt { jwt -> jwt.claim("sub", userId).claim("scope", "read:metrics") })
      .get().uri("/metrics").exchange()
      .expectStatus().is2xxSuccessful
      .expectBody()
      .jsonPath("$.length()").isEqualTo(1)
      .jsonPath("$[0].id").isEqualTo(metricId)
  }

  @Test
  internal fun `should return forbidden for wrong scope`() {
    rest.mutateWith(mockJwt().jwt { jwt -> jwt.claim("scope", "not-existing-scope") })
      .get().uri("/metrics").exchange()
      .expectStatus().isForbidden
  }

  @Test
  internal fun `should save new metric configuration`() {
    val userId = "existing-user"

    `when`(metricsService.createMetricConfiguration(userId, CreateMetric(name = "Overtime", tags = listOf("some-tag"), formula = "sum", timeUnit = ChronoUnit.WEEKS)))
      .thenReturn(Mono.just(MetricConfiguration(userId = userId)))

    rest.mutateWith(mockJwt().jwt { jwt -> jwt.claim("sub", userId).claim("scope", "create:metrics") })
      .mutateWith(csrf())
      .post()
      .uri("/metrics")
      .contentType(MediaType.APPLICATION_JSON)
      .body(Mono.just("""{"name":"Overtime", "tags":["some-tag"], "formula":"sum","timeUnit":"WEEKS"}"""), String::class.java)
      .exchange()
      .expectStatus().isCreated
      .expectBody().isEmpty

    verify(metricsService).createMetricConfiguration(userId, CreateMetric(name = "Overtime", tags = listOf("some-tag"), formula = "sum", timeUnit = ChronoUnit.WEEKS))
  }

}
