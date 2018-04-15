package io.ntf.api.activity;

import io.ntf.api.activity.model.Activity;
import lombok.Builder;
import lombok.Data;
import lombok.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.time.LocalDateTime;

@RestController
public class ActivityResource {

  private ActivityService activityService;

  public ActivityResource(ActivityService activityService) {
    this.activityService = activityService;
  }

  @GetMapping("/activities")
  public Flux<Activity> all(Mono<Principal> principal) {
    return principal
      .map(Principal::getName)
      .flatMapMany(name -> activityService.all(name));
  }

  @PostMapping("/activity")
  public Mono<ResponseEntity<Activity>> start(@RequestBody Mono<StartActivity> startActivity, Mono<Principal> principal) {
    return principal.map(Principal::getName)
      .zipWith(startActivity.map(StartActivity::getName))
      .flatMap(tpl -> activityService.start(tpl.getT1(), tpl.getT2()))
      .map(activity -> ResponseEntity.status(HttpStatus.CREATED).body(activity));
  }

  @GetMapping("/activity/running")
  public Mono<Activity> running(Mono<Principal> principal) {
    return principal.map(Principal::getName)
      .flatMap(activityService::running)
      .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)));
  }

  @PostMapping("/activity/stop")
  public Mono<Activity> stop(Mono<Principal> principal) {
    return principal.map(Principal::getName)
      .flatMap(activityService::stop);
  }

  @PutMapping("/activity/{id}")
  public Mono<Activity> update(@PathVariable("id") String id, @RequestBody Mono<UpdateActivity> updateActivity, Mono<Principal> principal) {
    return principal.map(Principal::getName)
      .zipWith(updateActivity)
      .flatMap(tpl -> activityService.update(tpl.getT1(), tpl.getT2()))
      .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)));
  }

  @DeleteMapping("/activity/{id}")
  public Mono<DeletedActivity> delete(@PathVariable("id") String id, Mono<Principal> principal) {
    return principal.map(Principal::getName)
      .flatMap(userId -> activityService.delete(userId, id))
      .map(a -> DeletedActivity.builder().id(a.getId()).start(a.getStart()).build())
      .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)));
  }

  @Data
  private static class StartActivity {
    private String name;
  }

  @Value
  @Builder
  private static class DeletedActivity {
    private String id;
    private LocalDateTime start;
  }
}
