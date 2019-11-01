package io.ntf.api.activity

import io.ntf.api.activity.model.Activity
import io.ntf.api.activity.model.ActivityRepository
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import reactor.core.scheduler.Scheduler
import reactor.core.scheduler.Schedulers
import reactor.test.StepVerifier
import java.time.LocalDateTime
import java.util.*
import java.util.concurrent.Executors
import java.util.function.Predicate


@DataMongoTest
@Import(ActivityService::class)
class ActivityServiceTest {

  @Autowired
  private val activityService: ActivityService? = null

  @Autowired
  private val activityRepository: ActivityRepository? = null

  @BeforeAll
  fun setUp() {
    activityRepository!!.deleteAll().block()
    activityRepository.save(Activity(null, USER_ID, null, "activity 1", NOW, null)).block()
    activityRepository.save(Activity(null, USER_ID, null, "activity 2", NOW.minusHours(1), NOW)).block()
    activityRepository.save(Activity(null, UUID.randomUUID().toString(), null, "another activity", NOW.minusHours(3), NOW.minusHours(2))).block()
  }

  @Test
  fun shouldReturnAllActivitiesOfAGivenUser() {
    StepVerifier.create(activityService!!.findByUserId(USER_ID))
      .expectNextMatches(activityWith("activity 1", NOW))
      .expectNextMatches(activityWith("activity 2", NOW.minusHours(1), NOW))
      .verifyComplete()
  }

  private fun activityWith(name: String, start: LocalDateTime, end: LocalDateTime? = null) =
    Predicate<Activity> { Activity(it.id, it.userId, null, name, start, end) == it }


  @TestConfiguration
  class Config {

    @Bean
    fun jdbcScheduler(): Scheduler {
      return Schedulers.fromExecutor(Executors.newFixedThreadPool(2))
    }

  }

  companion object {

    private val NOW = LocalDateTime.now()
    private val USER_ID = UUID.randomUUID().toString()
  }
}
