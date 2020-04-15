package io.ntf.api.statistics

import io.ntf.api.activity.ActivityService
import io.ntf.api.activity.model.Activity
import io.ntf.api.statistics.model.StatisticConfiguration
import io.ntf.api.statistics.model.StatisticConfigurationRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.Duration
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.time.temporal.WeekFields
import java.util.concurrent.TimeUnit
import kotlin.time.ExperimentalTime
import kotlin.time.toDuration
import kotlin.time.toJavaDuration


@Service
class StatisticsService(private val activityService: ActivityService,
                        private val statisticConfigurationRepository: StatisticConfigurationRepository) {

  @UseExperimental(ExperimentalTime::class)
  fun overtime(userId: String): Mono<Map<String, List<Overtime>>> {
    return statisticConfigurationRepository.findByUserId(userId)
      .flatMap { configuration ->
        val workingHoursPerWeek = configuration.hours
          .toDuration(TimeUnit.HOURS)
          .toJavaDuration()

        activityService.findByUserIdAndTags(userId = userId, tags = configuration.tags)
          .collectList()
          .map { activities ->
            val overtimes = activities
              .asSequence()
              .groupBy(weekDate)
              .map(toWeekDateWithTotalWorkTime)
              .map(toOvertimeFrom(workingHoursPerWeek))
              .sortedBy { it.week }
              .fold(emptyList<Overtime>()) { acc, overtime ->
                when (acc.isEmpty()) {
                  true -> listOf(overtime.copy(totalOvertime = overtime.overtime))
                  false -> listOf(overtime.copy(totalOvertime = overtime.overtime + acc.first().totalOvertime)) + acc
                }
              }

            configuration.name to overtimes
          }
      }
      .collectMap({ it.first }, { it.second })
  }

  private val weekDate: (Activity) -> LocalDate = { (_, _, _, start) ->
    val weekFields = WeekFields.ISO
    val weekOfYear = start.get(weekFields.weekOfYear())
    val year = start.year

    LocalDate.now()
      .withYear(year)
      .with(weekFields.weekOfYear(), weekOfYear.toLong())
      .with(weekFields.dayOfWeek(), 1)
  }

  private val toWeekDateWithTotalWorkTime: (Map.Entry<LocalDate, List<Activity>>) -> Pair<LocalDate, Duration> = { (key, activities) ->
    val totalDuration = activities
      .map { a -> a.duration() }
      .reduce { r, d -> r + d }
    key to totalDuration
  }

  private fun toOvertimeFrom(workingHoursPerWeek: Duration): (Pair<LocalDate, Duration>) -> Overtime = { (weekDate, totalWorkTime) ->
    val overtime = totalWorkTime.minus(workingHoursPerWeek)

    Overtime(week = weekDate,
      totalWorkTime = totalWorkTime,
      overtime = overtime)
  }

  fun updateConfiguration(userId: String, updatedConfiguration: UpdateStatisticConfiguration): Mono<StatisticConfiguration> {
    return statisticConfigurationRepository.findByUserIdAndId(userId, updatedConfiguration.id)
      .map { it.copy(name = updatedConfiguration.name) }
      .map { it.copy(tags = updatedConfiguration.tags) }
      .map { it.copy(hours = updatedConfiguration.hours) }
      .map { it.copy(timeUnit = updatedConfiguration.timeUnit) }
      .flatMap { statisticConfigurationRepository.save(it) }
  }

  fun findAllById(userId: String): Mono<List<StatisticConfiguration>> {
    return statisticConfigurationRepository.findByUserId(userId)
      .collectList()
  }

  fun createConfiguration(userId: String, configuration: CreateConfiguration): Mono<StatisticConfiguration> {
    val newConfiguration = StatisticConfiguration(
      userId = userId,
      name = configuration.name,
      hours = configuration.hours,
      timeUnit = configuration.timeUnit,
      tags = configuration.tags
    )
    return statisticConfigurationRepository.save(newConfiguration)
  }
}

data class UpdateStatisticConfiguration(
  val id: String,
  val name: String,
  val tags: List<String>,
  val hours: Double,
  val timeUnit: ChronoUnit
)
