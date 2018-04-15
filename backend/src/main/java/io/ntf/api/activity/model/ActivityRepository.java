package io.ntf.api.activity.model;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

public interface ActivityRepository extends ReactiveMongoRepository<Activity, String> {

  Flux<Activity> findByUserIdOrderByStartDesc(String userId);

  Flux<Activity> findByUserIdAndStartIsAfterOrderByStartDesc(String userId, LocalDateTime dateTime);

  Mono<Activity> findByUserIdAndId(String userId, String id);

  Mono<Activity> findByUserIdAndEndNull(String userId);
}
