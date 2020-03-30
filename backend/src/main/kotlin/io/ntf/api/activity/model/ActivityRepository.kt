package io.ntf.api.activity.model

import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

import java.time.LocalDateTime

interface ActivityRepository : ReactiveMongoRepository<Activity, String> {

  fun findByUserIdOrderByStartDesc(userId: String): Flux<Activity>

  fun findByUserIdAndLogIdIsNullAndStartIsAfterOrderByStartDesc(userId: String, dateTime: LocalDateTime): Flux<Activity>

  fun findByUserIdAndId(userId: String, id: String): Mono<Activity>

  fun findByUserIdAndEndNull(userId: String): Mono<Activity>

  fun findByLogIdAndUserId(logId: String, userId: String): Flux<Activity>

  fun findByUserIdOrderByLastModifiedDateDesc(userId: String): Flux<Activity>

  fun findByUserIdAndStartBetweenOrderByStartDesc(userId: String, from: LocalDateTime, to: LocalDateTime): Flux<Activity>

  fun countByUserIdAndStartBefore(userId: String, until: LocalDateTime): Mono<Long>
}
