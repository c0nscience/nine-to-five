package io.ntf.api.fixtures

import io.ntf.api.activity.model.Activity
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit
import java.time.temporal.TemporalUnit

private val NOW = LocalDateTime.of(2020, 1, 1, 8, 0)

fun createActivitiesFrom(
  userId: String,
  weeks: Long,
  dailyOvertime: Long,
  unit: TemporalUnit = ChronoUnit.MINUTES,
  now: () -> LocalDateTime = { NOW },
  tags: List<String> = emptyList()
): List<Activity> {
  val days: Long = 5
  val hours: Long = 6
  val duration: Long = 2

  val activityTemplate = Activity(
    userId = userId,
    name = "template",
    start = now(),
    end = now().plusHours(duration),
    tags = tags
  )

  return LongRange(0, weeks - 1)
    .addRange(days)
    .addRange(end = hours, step = duration)
    .map { (week, day, hour) ->
      val overtime = if (hour == 0L) {
        dailyOvertime
      } else {
        0
      }

      val name = "task #$week$day$hour"

      activityTemplate
        .withName(name)
        .shiftHours(hour)
        .shiftDays(day)
        .shiftWeeks(week)
        .addOvertime(overtime, unit)
    }
}

private fun LongRange.addRange(endExclusive: Long): List<Pair<Long, Long>> =
  this.flatMap { i ->
    LongRange(0, endExclusive - 1)
      .map { n -> Pair(i, n) }
  }

private fun List<Pair<Long, Long>>.addRange(end: Long, step: Long = 1): List<Triple<Long, Long, Long>> =
  this.flatMap { (i, n) ->
    LongRange(0, end)
      .step(step)
      .map { m -> Triple(i, n, m) }
  }

private fun Activity.withName(name: String): Activity =
  this.copy(name = name)

private fun Activity.shiftHours(hours: Long): Activity =
  this.alterDuration(startFunction = { it.plusHours(hours) }, endFunction = { it?.plusHours(hours) })

private fun Activity.shiftDays(days: Long): Activity =
  this.alterDuration(startFunction = { it.plusDays(days) }, endFunction = { it?.plusDays(days) })

private fun Activity.shiftWeeks(weeks: Long): Activity =
  this.alterDuration(startFunction = { it.plusWeeks(weeks) }, endFunction = { it?.plusWeeks(weeks) })

private fun Activity.addOvertime(overtime: Long, unit: TemporalUnit): Activity =
  this.alterDuration(startFunction = { it }, endFunction = { it?.plus(overtime, unit) })

private fun Activity.alterDuration(startFunction: (LocalDateTime) -> LocalDateTime,
                                   endFunction: (LocalDateTime?) -> LocalDateTime?): Activity =
  this.copy(start = startFunction(this.start), end = endFunction(this.end))

