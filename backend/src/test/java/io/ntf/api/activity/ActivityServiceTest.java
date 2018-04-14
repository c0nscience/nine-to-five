package io.ntf.api.activity;

import io.ntf.api.activity.model.Activity;
import io.ntf.api.activity.model.ActivityRepository;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.function.Predicate;

import static org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.*;


@RunWith(SpringRunner.class)
@DataJpaTest
@AutoConfigureTestDatabase(replace=Replace.NONE)
@Import(ActivityService.class)
public class ActivityServiceTest {

  private static final LocalDateTime NOW = LocalDateTime.now();
  private static final String USER_ID = UUID.randomUUID().toString();

  @Autowired
  private ActivityService activityService;

  @Autowired
  private ActivityRepository activityRepository;

  @Before
  public void setUp() {
    activityRepository.deleteAll();
    activityRepository.save(Activity.builder().userId(USER_ID).name("activity 1").start(NOW).build());
    activityRepository.save(Activity.builder().userId(USER_ID).name("activity 2").start(NOW.minusHours(1)).end(NOW).build());
    activityRepository.save(Activity.builder().userId(UUID.randomUUID().toString()).name("another activity").start(NOW.minusHours(3)).end(NOW.minusHours(2)).build());
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
    return activity -> Activity.builder()
      .id(activity.getId())
      .userId(activity.getUserId())
      .name(name)
      .start(start)
      .end(end)
      .build().equals(activity);
  }

  @TestConfiguration
  public static class Config {

    @Bean
    public Scheduler jdbcScheduler() {
      return Schedulers.fromExecutor(Executors.newFixedThreadPool(2));
    }

  }
}
