package io.ntf.api.metrics

import io.ntf.api.metrics.model.MetricConfiguration
import io.ntf.api.metrics.model.MetricConfigurationRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Service
class MetricsService(private val metricConfigurationRepository: MetricConfigurationRepository) {
  fun findAllByUserId(userId: String): Flux<MetricConfiguration> {
    return metricConfigurationRepository.findAllByUserId(userId)
  }

  fun createMetricConfiguration(userId: String, createMetric: CreateMetric): Mono<MetricConfiguration> {
    val metricConfigurationToSave = MetricConfiguration.from(userId, createMetric)

    return metricConfigurationRepository.save(metricConfigurationToSave)
  }

  private fun MetricConfiguration.Companion.from(userId: String, createMetric: CreateMetric) =
    MetricConfiguration(
      userId = userId,
      name = createMetric.name,
      tags = createMetric.tags,
      timeUnit = createMetric.timeUnit,
      formula = createMetric.formula
    )

}
