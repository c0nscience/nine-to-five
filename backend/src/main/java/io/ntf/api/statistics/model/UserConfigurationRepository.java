package io.ntf.api.statistics.model;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Mono;

public interface UserConfigurationRepository extends ReactiveMongoRepository<UserConfiguration, String> {
  Mono<UserConfiguration> findByUserId(String userId);
}
