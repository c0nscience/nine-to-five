package io.ntf.api.metrics

import io.ntf.api.metrics.model.MetricConfiguration
import io.ntf.api.metrics.model.MetricConfigurationRepository
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Assertions.*
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
import java.time.temporal.ChronoUnit
import java.util.*
import java.util.concurrent.Executors
import java.util.function.Predicate

@DataMongoTest
@Import(MetricsService::class)
class MetricsServiceTest {

  @Autowired
  lateinit var metricConfigurationRepository: MetricConfigurationRepository

  @Autowired
  lateinit var metricsService: MetricsService

  @BeforeEach
  fun setUp() {
    metricConfigurationRepository.run {
      deleteAll().block()
      save(MetricConfiguration(userId = USER_ID, name = "config 1", tags = listOf("tag-one"), formula = "sum", timeUnit = ChronoUnit.WEEKS)).block()
      save(MetricConfiguration(userId = USER_ID, name = "config 2", tags = listOf("tag-one", "tag-two"), formula = "avg", timeUnit = ChronoUnit.WEEKS)).block()
      save(MetricConfiguration(userId = UUID.randomUUID().toString(), name = "config 3", tags = listOf("tag-three"), formula = "avg", timeUnit = ChronoUnit.WEEKS)).block()
    }
  }

  @Test
  fun `should return all saved metric configurations for user`() {
    StepVerifier.create(metricsService.findAllByUserId(USER_ID))
      .expectNextMatches(withMetricConfiguration(USER_ID, "config 1", listOf("tag-one"), "sum"))
      .expectNextMatches(withMetricConfiguration(USER_ID, "config 2", listOf("tag-one", "tag-two"), "avg"))
      .verifyComplete()
  }

  private fun withMetricConfiguration(userId: String, name: String, tags: List<String>, formula: String) =
    Predicate<MetricConfiguration> { MetricConfiguration(id = it.id, userId = userId, name = name, tags = tags, formula = formula, timeUnit = ChronoUnit.WEEKS) == it }

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
