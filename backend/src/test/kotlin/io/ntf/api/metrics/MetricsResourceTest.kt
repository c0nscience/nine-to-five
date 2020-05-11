package io.ntf.api.metrics

import io.ntf.api.infrastructure.SecurityConfiguration
import io.ntf.api.metrics.model.MetricConfiguration
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.eq
import org.mockito.Mockito.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest
import org.springframework.boot.test.mock.mockito.SpyBean
import org.springframework.context.annotation.Import
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

  @SpyBean
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

    doReturn(Mono.just(MetricConfiguration(userId = userId)))
      .`when`(metricsService).createMetricConfiguration(anyString(), any(CreateMetric::class.java))

    //TODO no blody idea why the original method is called despite beeing mocked ??? ¯\_(ツ)_/¯

    rest.mutateWith(mockJwt().jwt { jwt -> jwt.claim("sub", userId).claim("scope", "create:metrics") })
      .mutateWith(csrf())
      .post()
      .uri("/metrics")
      .body(Mono.just(CreateMetric(name = "Overtime", tags = listOf("some-tag"), formula = "sum", timeUnit = ChronoUnit.WEEKS)), CreateMetric::class.java)
      .exchange()
      .expectStatus().isCreated

    verify(metricsService, times(1)).createMetricConfiguration(eq(userId), eq(CreateMetric(name = "Overtime", tags = listOf("some-tag"), formula = "sum", timeUnit = ChronoUnit.WEEKS)))
  }

}
