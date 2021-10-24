package io.ntf.api.metrics

import io.ntf.api.name
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
    return principal.name()
      .flatMapMany { metricsService.findAllByUserId(it) }
      .map { ListMetric(id = it.id!!, name = it.name) }
      .collectList()
  }

  @PostMapping("/metrics")
  fun createMetricConfiguration(
    principal: Mono<Principal>,
    @RequestBody createMetric: Mono<CreateMetric>
  ): Mono<ResponseEntity<Void>> {
    return principal.name()
      .zipWith(createMetric)
      .flatMap { (name, metricToCreate) -> metricsService.createMetricConfiguration(name, metricToCreate) }
      .map { ResponseEntity.status(HttpStatus.CREATED).build<Void>() }
  }

  @ExperimentalTime
  @GetMapping("metrics/{id}")
  fun getCalculatedMetric(
    principal: Mono<Principal>,
    @PathVariable("id") id: String
  ): Mono<MetricDetail> {
    return principal.name()
      .flatMap { userId -> metricsService.calculateMetricFor(userId, id) }
  }

  @DeleteMapping("metrics/{id}")
  fun deleteMetricConfiguration(
    principal: Mono<Principal>,
    @PathVariable("id") id: String
  ): Mono<ResponseEntity<Void>> {
    return principal.name()
      .flatMap { userId -> metricsService.deleteById(userId, id) }
      .map { ResponseEntity.status(HttpStatus.OK).build<Void>() }
  }

  @PostMapping("metrics/{id}")
  fun updateMetricConfiguration(
    principal: Mono<Principal>,
    @PathVariable("id") id: String,
    @RequestBody editMetric: EditMetric
  ): Mono<ResponseEntity<Void>> {
    return principal.name()
      .flatMap { userId -> metricsService.updateByUserIdAndId(userId, id, editMetric) }
      .map { ResponseEntity.status(HttpStatus.OK).build<Void>() }
  }

  @GetMapping("metrics/{id}/config")
  fun loadMetricConfiguration(
    principal: Mono<Principal>,
    @PathVariable("id") id: String
  ): Mono<MetricConfigurationEdit> {
    return principal.name()
      .flatMap { userId -> metricsService.findByUserIdAndId(userId, id) }
  }
}
