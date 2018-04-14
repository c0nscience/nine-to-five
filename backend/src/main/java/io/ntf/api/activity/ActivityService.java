package io.ntf.api.activity;

import io.ntf.api.activity.model.Activity;
import io.ntf.api.activity.model.ActivityRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Scheduler;

@Service
public class ActivityService {

  private ActivityRepository activityRepository;
  private Scheduler scheduler;

  public ActivityService(ActivityRepository activityRepository, @Qualifier("jdbcScheduler") Scheduler scheduler) {
    this.activityRepository = activityRepository;
    this.scheduler = scheduler;
  }

  @Transactional(readOnly = true)
  Flux<Activity> findByUserId(String userId) {
    return Flux.fromStream(activityRepository.findByUserIdOrderByStartDesc(userId).stream()).publishOn(scheduler);
  }
}
