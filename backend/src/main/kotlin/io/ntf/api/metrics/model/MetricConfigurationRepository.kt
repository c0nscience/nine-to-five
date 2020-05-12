package io.ntf.api.metrics.model

import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface MetricConfigurationRepository : ReactiveMongoRepository<MetricConfiguration, String> {
  fun findAllByUserId(userId: String): Flux<MetricConfiguration>
}
