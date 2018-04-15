package io.ntf.api.statistics.model;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

public interface UserConfigurationRepository extends ReactiveMongoRepository<UserConfiguration, String> {
}
