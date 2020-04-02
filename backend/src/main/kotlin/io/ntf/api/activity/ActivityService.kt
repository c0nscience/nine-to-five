package io.ntf.api.activity

import io.ntf.api.activity.model.Activity
import io.ntf.api.activity.model.ActivityRepository
import org.springframework.data.mongodb.core.ReactiveMongoTemplate
import org.springframework.data.mongodb.core.query.Query.query
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
class ActivityService(private val activityRepository: ActivityRepository, private val mongoTemplate: ReactiveMongoTemplate) : TimeTrait {

  fun findByUserId(userId: String): Flux<Activity> {
    return activityRepository.findByUserIdOrderByStartDesc(userId)
  }

  private fun findByUserIdAndId(userId: String, id: String): Mono<Activity> {
    return activityRepository.findByUserIdAndId(userId, id)
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

  fun deleteAll(userId: String, idsToDelete: Mono<List<String>>): Mono<Void> {
    return activityRepository.findAllById(idsToDelete.flatMapIterable { it })
      .filter { it.userId == userId }
      .collectList()
      .flatMap { activityRepository.deleteAll(Flux.fromIterable(it)) }
  }

  fun findAllUsedTags(userId: String): Flux<String> = mongoTemplate
    .query(Activity::class.java)
    .distinct(Activity::tags.name)
    .matching(query(where(Activity::userId).`is`(userId)))
    .`as`(String::class.java)
    .all()
}

data class UpdateActivity(val id: String, val name: String, val start: LocalDateTime, val end: LocalDateTime?, val tags: List<String>?)
