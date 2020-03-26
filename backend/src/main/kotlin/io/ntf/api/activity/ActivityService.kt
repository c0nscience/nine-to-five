package io.ntf.api.activity

import io.ntf.api.activity.model.Activity
import io.ntf.api.activity.model.ActivityRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.kotlin.core.publisher.toMono
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.format.DateTimeFormatter

typealias ByWeek = Map<String, ActivityService.WeekInformation>

@Service
class ActivityService(private val activityRepository: ActivityRepository, private val logService: LogService) : TimeTrait {

  fun findByUserId(userId: String): Flux<Activity> {
    return activityRepository.findByUserIdOrderByStartDesc(userId)
  }

  private fun findByUserIdAndId(userId: String, id: String): Mono<Activity> {
    return activityRepository.findByUserIdAndId(userId, id)
  }

  fun all(userId: String): Mono<ByWeek> {
    return allInRange(userId, now().minusDays(7).toLocalDate(), now().toLocalDate())
      .reduce(emptyMap()) { result: ByWeek, activity: Activity ->
      val weekDatePattern = DateTimeFormatter.ISO_WEEK_DATE
      val dayDatePattern = DateTimeFormatter.ISO_LOCAL_DATE
      val weekDate = activity.start.format(weekDatePattern).dropLast(2)
      val dayDate = activity.start.format(dayDatePattern)

      val duration = activity.duration()

      val week = result[weekDate] ?: unitWeek()

      val day = week.days[dayDate] ?: unitDay()

      val days = week.days + (dayDate to day.copy(totalDuration = day.totalDuration + duration, activities = day.activities + activity))

      result + (weekDate to week.copy(totalDuration = week.totalDuration + duration, days = days))
    }
  }

  fun getLastModifiedDate(name: String): Mono<LocalDateTime> {
    return activityRepository.findByUserIdOrderByLastModifiedDateDesc(name)
      .take(1)
      .toMono()
      .map { it.lastModifiedDate }
  }

  fun start(userId: String, name: String): Mono<Activity> {
    return running(userId)
      .flatMap { Mono.error<Activity>(ResponseStatusException(HttpStatus.BAD_REQUEST, "Can not start new activity while another is running.")) }
      .switchIfEmpty(startAndSaveActivityWith(userId, name))
  }

  private fun startAndSaveActivityWith(userId: String, name: String): Mono<Activity> {
    val activity = Activity(userId = userId, name = name, start = now())

    return Mono.just(activity)
      .flatMap { activityRepository.save(it) }
  }

  fun running(userId: String): Mono<Activity> {
    return activityRepository.findByUserIdAndEndNull(userId)
  }

  fun stop(userId: String): Mono<Activity> {
    return running(userId)
      .map { activity -> activity.copy(end = now()) }
      .flatMap { activityRepository.save(it) }
  }

  fun update(userId: String, updateActivity: UpdateActivity): Mono<Activity> {
    return findByUserIdAndId(userId, updateActivity.id)
      .map { activity -> activity.copy(name = updateActivity.name) }
      .map { activity -> activity.copy(start = updateActivity.start) }
      .map { activity -> updateActivity.end?.let { activity.copy(end = it) } ?: activity }
      .flatMap { activityRepository.save(it) }
  }

  fun delete(userId: String, id: String): Mono<Activity> {
    return findByUserIdAndId(userId, id)
      .flatMap {
        activityRepository.deleteById(it.id!!)
          .then(Mono.just(it))
      }
  }

  fun findByLogIdAndUserId(logId: String, userId: String): Flux<Activity> {
    return logService.findByLogIdAndUserId(logId, userId)
      .flatMapMany { (logId, userId, _) -> activityRepository.findByLogIdAndUserId(logId!!, userId) }
  }

  private fun unitWeek(): WeekInformation {
    return WeekInformation(Duration.ZERO, emptyMap())
  }

  private fun unitDay(): DayInformation {
    return DayInformation(Duration.ZERO, emptyList())
  }

  fun allInRange(name: String, from: LocalDate, to: LocalDate): Flux<Activity> {
    return activityRepository.findByUserIdAndStartBetweenOrderByStartDesc(name, from.atStartOfDay(), to.plusDays(1).atTime(LocalTime.MIDNIGHT))
  }

  data class WeekInformation(val totalDuration: Duration, val days: Map<String, DayInformation>)

  data class DayInformation(val totalDuration: Duration, val activities: List<Activity>)
}
