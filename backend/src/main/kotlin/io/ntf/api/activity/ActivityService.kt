package io.ntf.api.activity

import io.ntf.api.activity.model.Activity
import io.ntf.api.activity.model.ActivityRepository
import org.springframework.data.mongodb.core.ReactiveMongoTemplate
import org.springframework.data.mongodb.core.query.Query.query
import org.springframework.data.mongodb.core.query.and
import org.springframework.data.mongodb.core.query.where
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.kotlin.core.publisher.toMono
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@Service
class ActivityService(
  private val activityRepository: ActivityRepository,
  private val mongoTemplate: ReactiveMongoTemplate
) : TimeTrait {

  fun findByUserId(userId: String): Flux<Activity> {
    return activityRepository.findByUserIdOrderByStartDesc(userId)
  }

  fun findByUserIdAndId(userId: String, id: String): Mono<Activity> {
    return activityRepository.findByUserIdAndId(userId, id)
  }

  fun start(
    userId: String,
    name: String,
    start: LocalDateTime?,
    tags: List<String> = emptyList()
  ): Mono<Activity> {
    return running(userId)
      .flatMap { Mono.error<Activity>(ResponseStatusException(HttpStatus.BAD_REQUEST, "Can not start new activity while another is running.")) }
      .switchIfEmpty(startAndSaveActivityWith(userId, name, start?.adjust() ?: now(), tags))
  }

  private fun startAndSaveActivityWith(userId: String, name: String, start: LocalDateTime, tags: List<String>): Mono<Activity> {
    val activity = Activity(userId = userId, name = name, start = start, tags = tags)

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
      .map { it.copy(name = updateActivity.name) }
      .map { it.copy(start = updateActivity.start) }
      .map { a -> updateActivity.end?.let { a.copy(end = it) } ?: a }
      .map { a -> updateActivity.tags?.let { a.copy(tags = it.distinct()) } ?: a }
      .flatMap { activityRepository.save(it) }
  }

  fun delete(userId: String, id: String): Mono<Activity> {
    return findByUserIdAndId(userId, id)
      .flatMap {
        activityRepository.deleteById(it.id!!)
          .then(Mono.just(it))
      }
  }

  fun allInRange(userId: String, from: LocalDate, to: LocalDate): Flux<Activity> {
    return activityRepository.findByUserIdAndStartBetweenOrderByStartDesc(userId, from.atStartOfDay(), to.plusDays(1).atTime(LocalTime.MIDNIGHT))
  }

  fun countBefore(userId: String, until: LocalDate): Mono<Long> {
    return activityRepository.countByUserIdAndStartBefore(userId, until.atStartOfDay())
  }

  fun findAllUsedTags(userId: String): Flux<String> = mongoTemplate
    .query(Activity::class.java)
    .distinct(Activity::tags.name)
    .matching(query(where(Activity::userId).`is`(userId)))
    .`as`(String::class.java)
    .all()

  fun findByUserIdAndTags(userId: String, tags: List<String>): Flux<Activity> = mongoTemplate
    .query(Activity::class.java)
    .matching(query(where(Activity::userId).`is`(userId).and(Activity::tags).all(tags)))
    .all()

  fun create(userId: String, name: String, start: LocalDateTime, end: LocalDateTime, tags: List<String>): Mono<Void> {
    return Mono.just(Activity(userId = userId, name = name, start = start, end = end, tags = tags))
      .flatMap { activityRepository.save(it) }
      .thenEmpty(Mono.empty())
  }
}

data class UpdateActivity(val id: String, val name: String, val start: LocalDateTime, val end: LocalDateTime?, val tags: List<String>?)
