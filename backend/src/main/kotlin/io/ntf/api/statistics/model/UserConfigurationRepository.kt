package io.ntf.api.statistics.model

import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Mono

interface UserConfigurationRepository : ReactiveMongoRepository<UserConfiguration, String> {
    fun findByUserId(userId: String): Mono<UserConfiguration>
}
