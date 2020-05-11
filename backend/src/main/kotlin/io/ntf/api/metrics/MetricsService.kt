package io.ntf.api.metrics

import io.ntf.api.metrics.model.MetricConfiguration
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Service
class MetricsService {
  fun findAllByUserId(userId: String): Flux<MetricConfiguration> {
    return Flux.just()
  }

  fun createMetricConfiguration(userId: String, createMetric: CreateMetric): Mono<MetricConfiguration> {
    TODO("Not yet implemented")
  }

}
