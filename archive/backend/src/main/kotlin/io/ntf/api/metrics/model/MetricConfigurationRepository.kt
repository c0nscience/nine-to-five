package io.ntf.api.metrics.model

import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface MetricConfigurationRepository : ReactiveMongoRepository<MetricConfiguration, String> {
  fun findAllByUserId(userId: String): Flux<MetricConfiguration>
  fun findByUserIdAndId(userId: String, id: String): Mono<MetricConfiguration>
}
