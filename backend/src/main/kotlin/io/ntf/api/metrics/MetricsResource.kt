package io.ntf.api.metrics

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono
import reactor.kotlin.core.util.function.component1
import reactor.kotlin.core.util.function.component2
import java.security.Principal
import kotlin.time.ExperimentalTime

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

  @ExperimentalTime
  @GetMapping("metrics/{id}")
  fun getCalculatedMetric(principal: Mono<Principal>,
                          @PathVariable("id") id: String): Mono<MetricDetail> {
    return principal.map { it.name }
      .flatMap { userId -> metricsService.calculateMetricFor(userId, id) }
  }
}
