package io.ntf.api.statistics

import io.ntf.api.activity.ActivityService
import io.ntf.api.activity.model.Activity
import io.ntf.api.statistics.model.StatisticConfigurationRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.Duration
import java.time.LocalDate
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
}
