package io.ntf.api.activity;

import io.ntf.api.activity.model.Activity;
import io.ntf.api.activity.model.ActivityRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
@Slf4j
public class ActivityService {

  private ActivityRepository activityRepository;

  public ActivityService(ActivityRepository activityRepository) {
    this.activityRepository = activityRepository;
  }

  Flux<Activity> findByUserId(String userId) {
    return activityRepository.findByUserIdOrderByStartDesc(userId);
  }

  Mono<Activity> findByUserIdAndId(String userId, String id) {
    return activityRepository.findByUserIdAndId(userId, id);
  }

  Mono<Activity> start(String userId, String name) {
    return running(userId)
      .<Activity>flatMap(a -> Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Can not start new activity while another is running.")))
      .switchIfEmpty(startAndSaveActivityWith(userId, name));
  }

  private Mono<Activity> startAndSaveActivityWith(String userId, String name) {
    final Activity activity = Activity.builder()
      .userId(userId)
      .name(name)
      .start(LocalDateTime.now(ZoneOffset.UTC))
      .build();

    return Mono.just(activity)
      .flatMap(activityRepository::save);
  }

  Mono<Activity> running(String userId) {
    return activityRepository.findByUserIdAndEndNull(userId);
  }

  Mono<Activity> stop(String userId) {
    return running(userId)
      .map(activity -> activity.withEnd(LocalDateTime.now(ZoneOffset.UTC)))
      .flatMap(activityRepository::save);
  }

  Mono<Activity> update(String userId, UpdateActivity updateActivity) {
    return findByUserIdAndId(userId, updateActivity.getId())
      .map(activity -> activity.withName(updateActivity.getName()))
      .map(activity -> activity.withStart(updateActivity.getStart()))
      .map(activity -> updateActivity.getEnd().map(activity::withEnd).orElse(activity))
      .flatMap(activityRepository::save);
  }

  Mono<Activity> delete(String userId, String id) {
    return findByUserIdAndId(userId, id)
      .flatMap(a -> activityRepository.deleteById(a.getId())
        .then(Mono.just(a)));
  }
}
