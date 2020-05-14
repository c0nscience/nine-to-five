package io.ntf.api.metrics

import io.ntf.api.activity.ActivityService
import io.ntf.api.activity.model.Activity
import io.ntf.api.logger
import io.ntf.api.metrics.model.MetricConfiguration
import io.ntf.api.metrics.model.MetricConfigurationRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.Duration
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.time.temporal.TemporalUnit
import java.time.temporal.WeekFields
import kotlin.time.ExperimentalTime

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
      formula = createMetric.formula,
      threshold = createMetric.threshold
    )

  @ExperimentalTime
  fun calculateMetricFor(userId: String, id: String): Mono<MetricDetail> {
    return metricConfigurationRepository.findByUserIdAndId(userId, id)
      .flatMap { configuration ->
        activityService.findByUserIdAndTags(userId, configuration.tags)
          .collectList()
          .map { activities ->
            val metricValues = activities
              .asSequence()
              .groupBy(timeUnit(ChronoUnit.WEEKS))
              .map(toTimeUnitWithTotalDuration)
              .map(toMetricValue)
              .sortedBy { it.date }

            val totalExceedingDuration = metricValues
              .map { it.duration }
              .map { it.minus(configuration.thresholdAsDuration()) }
              .fold(Duration.ZERO) { r, d -> r + d }

            MetricDetail(
              id = configuration.id!!,
              name = configuration.name,
              totalExceedingDuration = totalExceedingDuration,
              formula = configuration.formula,
              threshold = configuration.threshold,
              values = metricValues
            )
          }
      }
  }

  private val timeUnit: (TemporalUnit) -> (Activity) -> LocalDate = { unit ->
    { (_, _, _, start) ->
      if (unit == ChronoUnit.WEEKS) {
        val weekFields = WeekFields.ISO
        val fieldValue = start.get(weekFields.weekOfYear())
        val year = start.year

        LocalDate.now()
          .withYear(year)
          .with(weekFields.weekOfYear(), fieldValue.toLong())
          .with(weekFields.dayOfWeek(), 1)
      } else {
        LocalDate.now()
      }

    }
  }

  private val toTimeUnitWithTotalDuration: (Map.Entry<LocalDate, List<Activity>>) -> Pair<LocalDate, Duration> = { (key, activities) ->
    val totalDuration = activities
      .map { a -> a.duration() }
      .reduce { r, d -> r + d }
    key to totalDuration
  }

  private val toMetricValue: (Pair<LocalDate, Duration>) -> MetricValue = { (timeUnit, totalDuration) ->
    MetricValue(
      duration = totalDuration,
      date = timeUnit
    )
  }
}

data class ListMetric(val id: String, val name: String)
data class CreateMetric(val name: String,
                        val tags: List<String>,
                        val formula: String,
                        val timeUnit: ChronoUnit,
                        val threshold: Double = 0.0)

data class MetricDetail(
  val id: String,
  val name: String,
  val totalExceedingDuration: Duration,
  val formula: String,
  val threshold: Double,
  val values: List<MetricValue>
)

data class MetricValue(val duration: Duration, val date: LocalDate)

