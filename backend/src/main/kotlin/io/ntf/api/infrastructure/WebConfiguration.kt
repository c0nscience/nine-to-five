package io.ntf.api.infrastructure

import io.ntf.api.activity.ActivityService
import io.ntf.api.logger
import io.ntf.api.statistics.model.UserConfiguration
import io.ntf.api.statistics.model.UserConfigurationRepository
import io.ntf.api.statistics.model.WorkTimeConfiguration
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.config.CorsRegistry
import org.springframework.web.reactive.config.WebFluxConfigurer

import java.time.LocalDate

@Configuration
class WebConfiguration : WebFluxConfigurer {

  private val log = logger()

  override fun addCorsMappings(registry: CorsRegistry) {
    registry.addMapping("/**")
      .allowedOrigins("http://localhost:3000", "https://ninetofive.tech")
      .allowedMethods("GET", "POST", "PUT", "DELETE", "HEAD")
  }

  @Bean
  fun commandLineRunner(userConfigurationRepository: UserConfigurationRepository) = CommandLineRunner {
    userConfigurationRepository.findByUserId("auth0|59ac17508f649c3f85124ec1")
      .switchIfEmpty(userConfigurationRepository.save(userConfigurationWith("auth0|59ac17508f649c3f85124ec1", LocalDate.of(2018, 4, 13), 36L)))
      .block()

    userConfigurationRepository.findByUserId("auth0|59cc17a23b09c52496036107")
      .switchIfEmpty(userConfigurationRepository.save(userConfigurationWith("auth0|59cc17a23b09c52496036107", LocalDate.of(2017, 10, 30), 36L)))
      .block()

  }

  @Bean
  fun testDistinctAggregate(activityService: ActivityService) = CommandLineRunner {
    activityService.findAllUsedTags("auth0|59ac17508f649c3f85124ec1")
      .doOnNext{t -> log.info("found tag: $t") }
      .blockLast()
  }

  private fun userConfigurationWith(userId: String, beginOfOvertimeCalculation: LocalDate, workingHoursPerWeek: Long): UserConfiguration {
    return UserConfiguration(
      userId = userId,
      workTimeConfiguration = WorkTimeConfiguration(
        beginOfOvertimeCalculation = beginOfOvertimeCalculation,
        workingHoursPerWeek = workingHoursPerWeek)
    )
  }
}
