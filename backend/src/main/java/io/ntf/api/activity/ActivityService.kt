package io.ntf.api.activity

import com.google.common.base.Stopwatch
import io.ntf.api.activity.model.Activity
import io.ntf.api.activity.model.ActivityRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.Duration
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit

typealias ByWeek = Map<String, ActivityService.WeekInformation>

@Service
class ActivityService(private val activityRepository: ActivityRepository, private val logService: LogService) : TimeTrait {

  private val log = LoggerFactory.getLogger(javaClass)

  fun findByUserId(userId: String): Flux<Activity> {
    return activityRepository.findByUserIdOrderByStartDesc(userId)
  }

  private fun findByUserIdAndId(userId: String, id: String): Mono<Activity> {
    return activityRepository.findByUserIdAndId(userId, id)
  }

  fun all(userId: String): Mono<ByWeek> {
    return transformTo(activityRepository.findByUserIdAndLogIdIsNullAndStartIsAfterOrderByStartDesc(userId, now().minusMonths(1)))
  }

  fun start(userId: String, name: String): Mono<Activity> {
    return running(userId)
      .flatMap { _ -> Mono.error<Activity>(ResponseStatusException(HttpStatus.BAD_REQUEST, "Can not start new activity while another is running.")) }
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

  private fun transformTo(activities: Flux<Activity>): Mono<ByWeek> {
    val stopwatch = Stopwatch.createStarted()
    return activities.reduce(emptyMap()) { result: ByWeek, activity: Activity ->
      val weekDatePattern = DateTimeFormatter.ofPattern("Y-w")
      val dayDatePattern = DateTimeFormatter.ISO_LOCAL_DATE
      val weekDate = activity.start.format(weekDatePattern)
      val dayDate = activity.start.format(dayDatePattern)

      val end = activity.end ?: now()
      val duration = Duration.between(activity.start, end)

      val week = result[weekDate] ?: unitWeek()

      val day = week.days[dayDate] ?: unitDay()

      val days = week.days + (dayDate to day.copy(totalDuration = day.totalDuration + duration, activities = day.activities + activity))

      result + (weekDate to week.copy(totalDuration = week.totalDuration + duration, days = days))
    }.doOnSuccess {
      log.info("Transforming took ${stopwatch.stop().elapsed(TimeUnit.MILLISECONDS)}ms")
    }
  }

  private fun unitWeek(): WeekInformation {
    return WeekInformation(Duration.ZERO, emptyMap())
  }

  private fun unitDay(): DayInformation {
    return DayInformation(Duration.ZERO, emptyList())
  }

  data class WeekInformation(val totalDuration: Duration, val days: Map<String, DayInformation>)

  data class DayInformation(val totalDuration: Duration, val activities: List<Activity>)
}
