package io.ntf.api.activity.model;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ActivityRepository extends ReactiveMongoRepository<Activity, String> {

  Flux<Activity> findByUserIdOrderByStartDesc(String userId);

  Mono<Activity> findByUserIdAndId(String userId, String id);

  Mono<Activity> findByUserIdAndEndNull(String userId);
}
