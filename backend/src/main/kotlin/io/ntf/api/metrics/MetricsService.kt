package io.ntf.api.metrics

import io.ntf.api.activity.ActivityService
import io.ntf.api.logger
import io.ntf.api.metrics.model.MetricConfiguration
import io.ntf.api.metrics.model.MetricConfigurationRepository
import kotlinx.coroutines.reactor.mono
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.Duration
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
class MetricsService(private val metricConfigurationRepository: MetricConfigurationRepository,
                     private val activityService: ActivityService) {
  private val log = logger()

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

  fun calculateMetricFor(userId: String, id: String): Mono<MetricDetail> {
    return metricConfigurationRepository.findByUserIdAndId(userId, id)
      .flatMap { configuration ->
        activityService.findByUserIdAndTags(userId, configuration.tags)
          .collectList()
          .flatMap { activities ->
            log.info("found #${activities.size}")

            //TODO carry over the calculation from the statistic service ... generalize it, avoid using specific names like 'overtime'

            Mono.empty<MetricDetail>()
          }
      }
  }

}

data class ListMetric(val id: String, val name: String)
data class CreateMetric(val name: String,
                        val tags: List<String>,
                        val formula: String,
                        val timeUnit: ChronoUnit)

data class MetricDetail(
  val id: String,
  val name: String,
  val total: Duration,
  val current: Duration,
  val formula: String,
  val threshold: Double,
  val values: List<MetricValue>
)

data class MetricValue(val duration: Duration, val date: LocalDate)

