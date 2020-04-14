package io.ntf.api.fixtures

import io.ntf.api.activity.model.Activity
import java.time.LocalDateTime

private val NOW = LocalDateTime.of(2020, 1, 1, 8, 0)

fun createActivitiesFrom(userId: String, weeks: Long, dailyOvertime: Long): List<Activity> {
  val activityTemplate = Activity(userId = userId, name = "template", start = NOW, end = NOW.plusHours(2))

  return LongRange(1, weeks).flatMap { week ->
    LongRange(0, 4).flatMap { day ->
      LongRange(0, 6).step(2)
        .map { hour -> Triple(week, day, hour) }
    }
  }.map { (week, day, hour) ->
    val overtime = if (hour == 0L) {
      dailyOvertime
    } else {
      0
    }

    activityTemplate.apply {
      withName("task #$week$day$hour")
      shiftHours(hour)
      shiftDays(day)
      shiftWeeks(week - 1)
      addOvertime(overtime)
    }
  }
}

private fun Activity.withName(name: String): Activity =
  this.copy(name = name)

private fun Activity.shiftHours(hours: Long): Activity =
  this.alterDuration(startFunction = { it.plusHours(hours) }, endFunction = { it?.plusHours(hours) })

private fun Activity.shiftDays(days: Long): Activity =
  this.alterDuration(startFunction = { it.plusDays(days) }, endFunction = { it?.plusDays(days) })

private fun Activity.shiftWeeks(weeks: Long): Activity =
  this.alterDuration(startFunction = { it.plusWeeks(weeks) }, endFunction = { it?.plusWeeks(weeks) })

private fun Activity.addOvertime(overtime: Long): Activity =
  this.alterDuration(startFunction = { it }, endFunction = { it?.plusMinutes(overtime) })

private fun Activity.alterDuration(startFunction: (LocalDateTime) -> LocalDateTime,
                                   endFunction: (LocalDateTime?) -> LocalDateTime?): Activity =
  this.copy(start = startFunction(this.start), end = endFunction(this.end))

