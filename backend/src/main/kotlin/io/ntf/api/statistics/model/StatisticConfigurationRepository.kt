package io.ntf.api.statistics.model

import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface StatisticConfigurationRepository: ReactiveMongoRepository<StatisticConfiguration, String> {
  fun findByUserId(userId: String): Flux<StatisticConfiguration>

  fun findByUserIdAndId(userId: String, id: String): Mono<StatisticConfiguration>
}
