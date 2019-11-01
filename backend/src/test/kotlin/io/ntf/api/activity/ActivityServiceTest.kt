package io.ntf.api.activity;

import io.ntf.api.activity.model.Activity;
import io.ntf.api.activity.model.ActivityRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.function.Predicate;


@DataMongoTest
@Import(ActivityService.class)
@Slf4j
public class ActivityServiceTest {

  private static final LocalDateTime NOW = LocalDateTime.now();
  private static final String USER_ID = UUID.randomUUID().toString();

  @Autowired
  private ActivityService activityService;

  @Autowired
  private ActivityRepository activityRepository;

  @BeforeAll
  public void setUp() {
    activityRepository.deleteAll().block();
    activityRepository.save(new Activity(null, USER_ID, null, "activity 1", NOW, null)).block();
    activityRepository.save(new Activity(null, USER_ID, null, "activity 2", NOW.minusHours(1), NOW)).block();
    activityRepository.save(new Activity(null, UUID.randomUUID().toString(), null, "another activity", NOW.minusHours(3), NOW.minusHours(2))).block();
  }

  @Test
  public void shouldReturnAllActivitiesOfAGivenUser() {
    StepVerifier.create(activityService.findByUserId(USER_ID))
      .expectNextMatches(activityWith("activity 1", NOW))
      .expectNextMatches(activityWith("activity 2", NOW.minusHours(1), NOW))
      .verifyComplete();
  }

  private Predicate<Activity> activityWith(String name, LocalDateTime start) {
    return activityWith(name, start, null);
  }

  private Predicate<Activity> activityWith(String name, LocalDateTime start, LocalDateTime end) {
    return activity -> new Activity(activity.getId(), activity.getUserId(), null, name, start, end).equals(activity);
  }

  @TestConfiguration
  public static class Config {

    @Bean
    public Scheduler jdbcScheduler() {
      return Schedulers.fromExecutor(Executors.newFixedThreadPool(2));
    }

  }
}
