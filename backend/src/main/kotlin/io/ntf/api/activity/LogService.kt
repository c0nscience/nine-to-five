package io.ntf.api.activity

import io.ntf.api.activity.model.ActivityRepository
import io.ntf.api.activity.model.Log
import io.ntf.api.activity.model.LogRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.util.function.component1
import reactor.util.function.component2

@Service
class LogService(private val logRepository: LogRepository, private val activityRepository: ActivityRepository) {

  fun findByLogIdAndUserId(logId: String, userId: String): Mono<Log> {
    return logRepository.findByIdAndUserId(logId, userId)
  }

  fun findByUserId(userId: String): Flux<Log> {
    return logRepository.findByUserId(userId)
  }

  fun create(userId: String, newLog: NewLog): Mono<Log> {
    return logRepository.save(Log.from(userId, newLog))
  }

  fun update(logId: String, userId: String, updatedLog: UpdatedLog): Mono<Log> {
    return findByLogIdAndUserId(logId, userId).map { log -> updatedLog.name?.let { log.copy(name = it) } ?: log }
  }

  fun delete(id: String, userId: String): Mono<Void> {
    return findByLogIdAndUserId(id, userId)
      .zipWith(activityRepository.findByLogIdAndUserId(id, userId).hasElements())
      .flatMap { (log, activitiesAreReferencedByLog) ->
        if (activitiesAreReferencedByLog) Mono.empty() else logRepository.delete(log)
      }
  }

}
