package io.ntf.api.activity.model

import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface LogRepository : ReactiveMongoRepository<Log, String> {
  fun findByIdAndUserId(logId: String, userId: String): Mono<Log>
  fun findByUserId(userId: String): Flux<Log>
}
