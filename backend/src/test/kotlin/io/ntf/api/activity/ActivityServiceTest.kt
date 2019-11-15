package io.ntf.api.activity

import io.ntf.api.activity.model.Activity
import io.ntf.api.activity.model.ActivityRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.test.mock.mockito.MockBean
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

  @MockBean
  private val logServiceTest: LogService? = null

  @Autowired
  private val activityRepository: ActivityRepository? = null

  @BeforeEach
  internal fun setUp() {
    activityRepository!!.deleteAll().block()
    activityRepository.save(Activity(null, USER_ID, null, "activity 1", NOW, null)).block()
    activityRepository.save(Activity(null, USER_ID, null, "activity 2", NOW.minusHours(1), NOW)).block()
    activityRepository.save(Activity(null, ADJUSTED_USER, null, "activity 3", LocalDateTime.of(2019, 1, 1, 10, 3, 34), LocalDateTime.of(2019, 1, 1, 12, 47, 2))).block()
    activityRepository.save(Activity(null, ADJUSTED_USER, null, "activity 4", LocalDateTime.of(2019, 1, 2, 11, 34, 12), LocalDateTime.of(2019, 1, 2, 11, 51, 12))).block()
    activityRepository.save(Activity(null, ADJUSTED_USER, null, "activity 5", LocalDateTime.of(2019, 1, 3, 11, 34), LocalDateTime.of(2019, 1, 3, 11, 51))).block()
    activityRepository.save(Activity(null, ADJUSTED_USER, null, "activity 6", LocalDateTime.of(2019, 1, 4, 11, 35), LocalDateTime.of(2019, 1, 4, 11, 50))).block()
    activityRepository.save(Activity(null, ADJUSTED_USER, null, "activity 7", LocalDateTime.of(2019, 1, 4, 11, 35, 12), LocalDateTime.of(2019, 1, 4, 11, 50, 14))).block()
    activityRepository.save(Activity(null, UUID.randomUUID().toString(), null, "another activity", NOW.minusHours(3), NOW.minusHours(2))).block()
  }

  @Test
  fun shouldReturnAllActivitiesOfAGivenUser() {
    StepVerifier.create(activityService!!.findByUserId(USER_ID))
      .expectNextMatches(activityWith("activity 1", NOW))
      .expectNextMatches(activityWith("activity 2", NOW.minusHours(1), NOW))
      .verifyComplete()
  }

  @Test
  fun shouldReturnAllActivitiesOfGivenUserWithAdjustedTimes() {
    StepVerifier.create(activityService!!.adjustAll(ADJUSTED_USER))
      .expectNextMatches(activityWith("activity 7", LocalDateTime.of(2019, 1, 4, 11, 35), LocalDateTime.of(2019, 1, 4, 11, 50)))
      .expectNextMatches(activityWith("activity 5", LocalDateTime.of(2019, 1, 3, 11, 35), LocalDateTime.of(2019, 1, 3, 11, 50)))
      .expectNextMatches(activityWith("activity 4", LocalDateTime.of(2019, 1, 2, 11, 35), LocalDateTime.of(2019, 1, 2, 11, 50)))
      .expectNextMatches(activityWith("activity 3", LocalDateTime.of(2019, 1, 1, 10, 5), LocalDateTime.of(2019, 1, 1, 12, 45)))
      .verifyComplete()
  }

  private fun activityWith(name: String, start: LocalDateTime, end: LocalDateTime? = null) =
    Predicate<Activity> { Activity(it.id, it.userId, null, name, start, end) == it.copy(createdDate = null, lastModifiedDate = null) }


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
    private val ADJUSTED_USER = UUID.randomUUID().toString()
  }
}
