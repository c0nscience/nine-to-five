package io.ntf.api.metrics

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono
import java.security.Principal
import java.time.temporal.ChronoUnit
import reactor.kotlin.core.util.function.*

@RestController
class MetricsResource(private val metricsService: MetricsService) {

  @GetMapping("/metrics")
  fun getAllMetrics(principal: Mono<Principal>): Mono<List<ListMetric>> {
    return principal.map { it.name }
      .flatMapMany { metricsService.findAllByUserId(it) }
      .map { ListMetric(id = it.id!!, name = it.name) }
      .collectList()
  }

  @PostMapping("/metrics")
  fun createMetricConfiguration(principal: Mono<Principal>,
                                @RequestBody createMetric: Mono<CreateMetric>): Mono<ResponseEntity<Void>> {
    return principal.map { it.name }
      .zipWith(createMetric)
      .flatMap { (name, metricToCreate) -> metricsService.createMetricConfiguration(name, metricToCreate) }
      .map { ResponseEntity.status(HttpStatus.CREATED).build<Void>() }
  }
}

data class ListMetric(val id: String, val name: String)
data class CreateMetric(val name: String,
                        val tags: List<String>,
                        val formula: String,
                        val timeUnit: ChronoUnit)
