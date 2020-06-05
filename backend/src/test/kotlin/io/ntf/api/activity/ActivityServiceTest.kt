package io.ntf.api.activity

import io.ntf.api.activity.model.Activity
import io.ntf.api.activity.model.ActivityRepository
import org.junit.jupiter.api.BeforeEach
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
  lateinit var activityService: ActivityService

  @Autowired
  lateinit var activityRepository: ActivityRepository

  @BeforeEach
  fun setUp() {
    activityRepository.run {
      deleteAll().block()
      save(Activity(null, USER_ID, "activity 1", NOW, null)).block()
      save(Activity(null, USER_ID, "activity 2", NOW.minusHours(1), NOW)).block()
      save(Activity(null, UUID.randomUUID().toString(), "another activity", NOW.minusHours(3), NOW.minusHours(2))).block()
    }
  }

  @Test
  fun `should return all activities of a given user`() {
    StepVerifier.create(activityService.findByUserId(USER_ID))
      .expectNextMatches(activityWith("activity 1", NOW))
      .expectNextMatches(activityWith("activity 2", NOW.minusHours(1), NOW))
      .verifyComplete()
  }

  private fun activityWith(name: String, start: LocalDateTime, end: LocalDateTime? = null, tags: List<String> = emptyList()) =
    Predicate<Activity> { Activity(it.id, it.userId, name, start, end, tags) == it }

  @Test
  internal fun `should return all activities for one day`() {
    activityRepository.run {
      deleteAll().block()

      save(Activity(userId = USER_ID, name = "today", start = NOW, end = NOW.plusHours(1))).block()

      save(Activity(userId = USER_ID, name = "tomorrow", start = NOW.plusDays(1), end = NOW.plusDays(1).plusHours(1))).block()
    }

    StepVerifier.create(activityService.allInRange(USER_ID, NOW.toLocalDate(), NOW.toLocalDate()))
      .expectNextMatches(activityWith("today", NOW, NOW.plusHours(1)))
      .verifyComplete()
  }

  @Test
  internal fun `should start activity with name, tags and start`() {
    activityService.stop(USER_ID).block()

    StepVerifier.create(activityService.start(USER_ID, "new task", NOW, listOf("new-tag")))
      .expectNextMatches(activityWith(name = "new task", start = NOW, tags = listOf("new-tag")))
      .verifyComplete()
  }

  @Test
  internal fun `should return all activities which contain all the given tags`() {
    activityRepository.run {
      deleteAll().block()
      save(Activity(userId = USER_ID, name = "task #1", start = NOW, end = NOW.plusHours(1), tags = listOf("acme", "meeting"))).block()
      save(Activity(userId = USER_ID, name = "task #2", start = NOW.minusHours(1), end = NOW, tags = listOf("acme"))).block()
      save(Activity(userId = USER_ID, name = "task #3", start = NOW.plusHours(1), end = NOW.plusHours(2), tags = listOf("meeting","acme"))).block()
    }

    StepVerifier.create(activityService.findByUserIdAndTags(USER_ID, listOf("acme", "meeting")))
      .expectNextMatches(activityWith(name = "task #1", start = NOW, end = NOW.plusHours(1), tags = listOf("acme", "meeting")))
      .expectNextMatches(activityWith(name = "task #3", start = NOW.plusHours(1), end = NOW.plusHours(2), tags = listOf("meeting", "acme")))
      .verifyComplete()
  }

  @TestConfiguration
  class Config {

    @Bean
    fun jdbcScheduler(): Scheduler {
      return Schedulers.fromExecutor(Executors.newFixedThreadPool(2))
    }

  }

  companion object : TimeTrait {

    private val NOW = LocalDateTime.now().adjust()
    private val USER_ID = UUID.randomUUID().toString()
  }
}
