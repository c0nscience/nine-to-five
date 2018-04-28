package io.ntf.api.activity

import io.ntf.api.activity.model.Activity
import io.ntf.api.activity.model.ActivityRepository
import lombok.extern.slf4j.Slf4j
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import java.time.ZoneOffset

@Service
@Slf4j
class ActivityService(private val activityRepository: ActivityRepository, private val logService: LogService) {

  fun findByUserId(userId: String): Flux<Activity> {
    return activityRepository.findByUserIdOrderByStartDesc(userId)
  }

  private fun findByUserIdAndId(userId: String, id: String): Mono<Activity> {
    return activityRepository.findByUserIdAndId(userId, id)
  }

  fun all(userId: String): Flux<Activity> {
    return activityRepository.findByUserIdAndLogIdIsNullAndStartIsAfterOrderByStartDesc(userId, LocalDateTime.now().minusMonths(1))
  }

  fun start(userId: String, name: String): Mono<Activity> {
    return running(userId)
      .flatMap { _ -> Mono.error<Activity>(ResponseStatusException(HttpStatus.BAD_REQUEST, "Can not start new activity while another is running.")) }
      .switchIfEmpty(startAndSaveActivityWith(userId, name))
  }

  private fun startAndSaveActivityWith(userId: String, name: String): Mono<Activity> {
    val activity = Activity(userId = userId, name = name, start = LocalDateTime.now(ZoneOffset.UTC))

    return Mono.just(activity)
      .flatMap { activityRepository.save(it) }
  }

  fun running(userId: String): Mono<Activity> {
    return activityRepository.findByUserIdAndEndNull(userId)
  }

  fun stop(userId: String): Mono<Activity> {
    return running(userId)
      .map { activity -> activity.copy(end = LocalDateTime.now(ZoneOffset.UTC)) }
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
}
