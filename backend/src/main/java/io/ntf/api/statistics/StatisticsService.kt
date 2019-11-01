package io.ntf.api.statistics

import io.ntf.api.activity.ActivityService
import io.ntf.api.statistics.model.UserConfiguration
import io.ntf.api.statistics.model.UserConfigurationRepository
import io.ntf.api.statistics.model.WorkTimeConfiguration
import org.springframework.stereotype.Service
import reactor.kotlin.core.util.function.component1
import reactor.kotlin.core.util.function.component2
import java.time.Duration
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.time.temporal.WeekFields


@Service
class StatisticsService(private val activityService: ActivityService,
                        private val userConfigurationRepository: UserConfigurationRepository) {

  fun overtime(userId: String) = activityService.findByUserId(userId)
    .collectList()
    .zipWith(userConfigurationRepository.findByUserId(userId).defaultIfEmpty(defaultUserConfiguration()))
    .map { (activities, userConfiguration) ->
      val workTimeConfiguration = userConfiguration.workTimeConfiguration
      val beginOfOvertimeCalculation = workTimeConfiguration.beginOfOvertimeCalculation

      activities.asSequence()
        .filter { (_, _, _, _, start) -> start.toLocalDate().isAfter(beginOfOvertimeCalculation) || start.toLocalDate().isEqual(beginOfOvertimeCalculation) }
        .groupBy { (_, _, _, _, start) ->
          val weekFields = WeekFields.ISO
          val weekOfYear = start.get(weekFields.weekOfYear())
          val year = start.year

          LocalDate.now()
            .withYear(year)
            .with(weekFields.weekOfYear(), weekOfYear.toLong())
            .with(weekFields.dayOfWeek(), 1)
        }
        .map { (week, activities) -> week to activities.map { it.duration() }.reduce { acc, duration -> acc.plus(duration) } }
        .map { (week, totalWorkTime) ->
          val workingHoursPerWeek = workTimeConfiguration.workingHoursPerWeek.let { Duration.of(it, ChronoUnit.HOURS) }
          val overtime = totalWorkTime.minus(workingHoursPerWeek)
          Overtime(
            week = week,
            totalWorkTime = totalWorkTime,
            overtime = overtime)
        }
        .sortedBy { it.week }
        .fold(emptyList<Overtime>()) { result, current ->
          when (result.isEmpty()) {
            true -> listOf(current.copy(totalOvertime = current.overtime))
            false -> listOf(current.copy(totalOvertime = current.overtime.plus(result.first().totalOvertime))) + result
          }
        }
    }

  private fun defaultUserConfiguration() = UserConfiguration(
    userId = "default user config",
    workTimeConfiguration = WorkTimeConfiguration(
      beginOfOvertimeCalculation = LocalDate.MIN,
      workingHoursPerWeek = 40L))
}
