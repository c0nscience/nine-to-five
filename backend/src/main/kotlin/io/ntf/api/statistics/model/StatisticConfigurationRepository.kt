package io.ntf.api.statistics.model

import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface StatisticConfigurationRepository: ReactiveMongoRepository<StatisticConfiguration, String> {
  fun findByUserId(userId: String): Flux<StatisticConfiguration>
}
