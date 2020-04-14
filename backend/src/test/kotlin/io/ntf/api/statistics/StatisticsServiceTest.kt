package io.ntf.api.statistics

import io.ntf.api.activity.ActivityService
import io.ntf.api.fixtures.createActivitiesFrom
import io.ntf.api.statistics.model.StatisticConfiguration
import io.ntf.api.statistics.model.StatisticConfigurationRepository
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Bean
import org.springframework.test.context.junit.jupiter.SpringExtension
import reactor.core.publisher.Flux
import reactor.test.StepVerifier
import java.time.Duration
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.time.temporal.WeekFields
import java.util.*

@ExtendWith(SpringExtension::class)
class StatisticsServiceTest {

  @Autowired
  private lateinit var statisticsService: StatisticsService

  @MockBean
  private lateinit var activityService: ActivityService

  @MockBean
  private lateinit var statisticConfigurationRepository: StatisticConfigurationRepository

  @Test
  fun `Test overtime calculation for user`() {
    val userId = UUID.randomUUID().toString()

    `when`(statisticConfigurationRepository.findByUserId(userId))
      .thenReturn(Flux.just(StatisticConfiguration(userId = userId, name = "acme #1", hours = 40.0, timeUnit = ChronoUnit.WEEKS, tags = listOf("tag"))))

    `when`(activityService.findByUserIdAndTags(userId, listOf("tag")))
      .thenReturn(Flux.fromIterable(createActivitiesFrom(userId = userId, weeks = 2, dailyOvertime = 12)))

    val week = LocalDate.now()
      .withYear(2020)
      .with(WeekFields.ISO.weekOfYear(), 1)
      .with(WeekFields.ISO.dayOfWeek(), 1)
    StepVerifier.create(statisticsService.overtime(userId))
      .expectNext(mapOf("acme #1" to listOf(
        Overtime(week = week.plusWeeks(1),
          totalWorkTime = Duration.ofHours(41),
          overtime = Duration.ofHours(1),
          totalOvertime = Duration.ofHours(2)),
        Overtime(week = week,
          totalWorkTime = Duration.ofHours(41),
          overtime = Duration.ofHours(1),
          totalOvertime = Duration.ofHours(1)))))
      .verifyComplete()
  }

  @Test
  fun `Test overtime calculation for user with multiple configurations`() {
    val userId = UUID.randomUUID().toString()

    `when`(statisticConfigurationRepository.findByUserId(userId))
      .thenReturn(Flux.just(
        StatisticConfiguration(userId = userId, name = "first", hours = 40.0, timeUnit = ChronoUnit.WEEKS, tags = listOf("first-company")),
        StatisticConfiguration(userId = userId, name = "second", hours = 36.0, timeUnit = ChronoUnit.WEEKS, tags = listOf("second-company"))
      ))

    `when`(activityService.findByUserIdAndTags(userId, listOf("first-company")))
      .thenReturn(Flux.fromIterable(createActivitiesFrom(userId = userId, weeks = 2, dailyOvertime = 12)))

    `when`(activityService.findByUserIdAndTags(userId, listOf("second-company")))
      .thenReturn(Flux.fromIterable(createActivitiesFrom(userId = userId, weeks = 2, dailyOvertime = 0)))

    val week = LocalDate.now()
      .withYear(2020)
      .with(WeekFields.ISO.weekOfYear(), 1)
      .with(WeekFields.ISO.dayOfWeek(), 1)
    StepVerifier.create(statisticsService.overtime(userId))
      .expectNext(mapOf("first" to listOf(
        Overtime(week = week.plusWeeks(1),
          totalWorkTime = Duration.ofHours(41),
          overtime = Duration.ofHours(1),
          totalOvertime = Duration.ofHours(2)),
        Overtime(week = week,
          totalWorkTime = Duration.ofHours(41),
          overtime = Duration.ofHours(1),
          totalOvertime = Duration.ofHours(1))),
        "second" to listOf(
          Overtime(week = week.plusWeeks(1),
            totalWorkTime = Duration.ofHours(40),
            overtime = Duration.ofHours(4),
            totalOvertime = Duration.ofHours(8)),
          Overtime(week = week,
            totalWorkTime = Duration.ofHours(40),
            overtime = Duration.ofHours(4),
            totalOvertime = Duration.ofHours(4)))
      ))
      .verifyComplete()
  }

  @TestConfiguration
  class Config {

    @Bean
    fun statisticsService(activityService: ActivityService, statisticConfigurationRepository: StatisticConfigurationRepository): StatisticsService {
      return StatisticsService(activityService, statisticConfigurationRepository)
    }

  }
}
