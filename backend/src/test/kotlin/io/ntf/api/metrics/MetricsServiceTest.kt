package io.ntf.api.metrics

import io.ntf.api.activity.ActivityService
import io.ntf.api.activity.model.ActivityRepository
import io.ntf.api.fixtures.createActivitiesFrom
import io.ntf.api.metrics.model.MetricConfiguration
import io.ntf.api.metrics.model.MetricConfigurationRepository
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
import java.time.*
import java.time.temporal.ChronoUnit
import java.util.*
import java.util.concurrent.Executors
import java.util.function.Predicate
import kotlin.time.ExperimentalTime

@DataMongoTest
@Import(MetricsService::class, ActivityService::class)
class MetricsServiceTest {

  @Autowired
  lateinit var metricConfigurationRepository: MetricConfigurationRepository

  @Autowired
  lateinit var metricsService: MetricsService

  @Autowired
  lateinit var activityRepository: ActivityRepository

  @BeforeEach
  fun setUp() {
    metricConfigurationRepository.run {
      deleteAll().block()
      save(MetricConfiguration(userId = USER_ID, name = "config 1", tags = listOf("tag-one"), formula = "sum", timeUnit = ChronoUnit.WEEKS)).block()
      save(MetricConfiguration(userId = USER_ID, name = "config 2", tags = listOf("tag-one", "tag-two"), formula = "avg", timeUnit = ChronoUnit.WEEKS)).block()
      save(MetricConfiguration(userId = UUID.randomUUID().toString(), name = "config 3", tags = listOf("tag-three"), formula = "avg", timeUnit = ChronoUnit.WEEKS)).block()
    }

    activityRepository.run {
      deleteAll().block()
    }
  }

  @Test
  fun `should return all saved metric configurations for user`() {
    StepVerifier.create(metricsService.findAllByUserId(USER_ID))
      .expectNextMatches(withMetricConfiguration(USER_ID, "config 1", listOf("tag-one"), "sum"))
      .expectNextMatches(withMetricConfiguration(USER_ID, "config 2", listOf("tag-one", "tag-two"), "avg"))
      .verifyComplete()
  }

  private fun withMetricConfiguration(userId: String, name: String, tags: List<String>, formula: String, threshold: Double = 0.0) =
    Predicate<MetricConfiguration> { MetricConfiguration(id = it.id, userId = userId, name = name, tags = tags, formula = formula, timeUnit = ChronoUnit.WEEKS, threshold = threshold) == it }

  @Test
  fun `should save new metric configuration`() {
    val createMetric = CreateMetric(
      name = "overtime",
      tags = listOf("some-tag"),
      timeUnit = ChronoUnit.WEEKS,
      formula = "sum"
    )

    StepVerifier.create(metricConfigurationRepository.count())
      .expectNext(3)
      .verifyComplete()

    StepVerifier.create(metricsService.createMetricConfiguration(USER_ID, createMetric))
      .expectNextMatches(
        withMetricConfiguration(
          userId = USER_ID,
          name = "overtime",
          tags = listOf("some-tag"),
          formula = "sum"
        )
      )
      .verifyComplete()

    StepVerifier.create(metricConfigurationRepository.count())
      .expectNext(4)
      .verifyComplete()
  }

  @Test
  fun `should save new metric configuration with threshold`() {
    val createMetric = CreateMetric(
      name = "overtime",
      tags = listOf("some-tag"),
      timeUnit = ChronoUnit.WEEKS,
      formula = "sum",
      threshold = 40.0
    )

    StepVerifier.create(metricConfigurationRepository.count())
      .expectNext(3)
      .verifyComplete()

    StepVerifier.create(metricsService.createMetricConfiguration(USER_ID, createMetric))
      .expectNextMatches(
        withMetricConfiguration(
          userId = USER_ID,
          name = "overtime",
          tags = listOf("some-tag"),
          formula = "sum",
          threshold = 40.0
        )
      )
      .verifyComplete()

    StepVerifier.create(metricConfigurationRepository.count())
      .expectNext(4)
      .verifyComplete()
  }

  @ExperimentalTime
  @Test
  internal fun `should calculate limited sum metric for user and configuration id`() {
    val date = LocalDate.of(2020, Month.MAY, 11)
    val metricConfiguration = metricConfigurationRepository.save(MetricConfiguration(
      name = "overtime",
      timeUnit = ChronoUnit.WEEKS,
      tags = listOf("acme"),
      userId = USER_ID,
      formula = "limited-sum",
      threshold = 40.0
    )).block()

    activityRepository.saveAll(createActivitiesFrom(
      USER_ID,
      weeks = 1,
      dailyOvertime = 30,
      now = { LocalDateTime.of(date, LocalTime.of(8, 0)) },
      tags = listOf("acme")
    )).blockLast()

    StepVerifier.create(metricsService.calculateMetricFor(USER_ID, metricConfiguration?.id!!))
      .expectNext(MetricDetail(
        id = metricConfiguration.id!!,
        name = "overtime",
        totalExceedingDuration = Duration.ofHours(2).plusMinutes(30),
        formula = "limited-sum",
        threshold = 40.0,
        values = listOf(MetricValue(
          duration = Duration.ofHours(42).plusMinutes(30),
          date = date
        ))
      ))
      .verifyComplete()
  }

  @ExperimentalTime
  @Test
  internal fun `should return a usable result for no activities`() {
    val metricConfiguration = metricConfigurationRepository.save(MetricConfiguration(
      name = "overtime",
      timeUnit = ChronoUnit.WEEKS,
      tags = listOf("acme"),
      userId = USER_ID,
      formula = "limited-sum",
      threshold = 40.0
    )).block()

    StepVerifier.create(metricsService.calculateMetricFor(USER_ID, metricConfiguration?.id!!))
      .expectNext(MetricDetail(
        id = metricConfiguration.id!!,
        name = "overtime",
        totalExceedingDuration = Duration.ZERO,
        formula = "limited-sum",
        threshold = 40.0,
        values = emptyList()
      ))
      .verifyComplete()
  }

  //TODO test a gapless calculation

  companion object {
    val USER_ID = UUID.randomUUID().toString()
  }

  @TestConfiguration
  class Config {

    @Bean
    fun jdbcScheduler(): Scheduler {
      return Schedulers.fromExecutor(Executors.newFixedThreadPool(2))
    }

  }

}
