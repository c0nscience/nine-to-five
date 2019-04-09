package io.ntf.api.infrastructure;

import io.ntf.api.statistics.model.UserConfiguration;
import io.ntf.api.statistics.model.UserConfigurationRepository;
import io.ntf.api.statistics.model.WorkTimeConfiguration;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

import java.time.LocalDate;

@Configuration
public class WebConfiguration implements WebFluxConfigurer {

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
      .allowedOrigins("http://localhost:3000", "https://ntf-webapp.herokuapp.com", "https://nine-to-five-git-master.conscience.now.sh/")
      .allowedMethods("GET", "POST", "PUT", "DELETE");
  }

  @Bean
  public CommandLineRunner commandLineRunner(UserConfigurationRepository userConfigurationRepository) {
    return args -> {
      userConfigurationRepository.findByUserId("auth0|59ac17508f649c3f85124ec1")
        .switchIfEmpty(userConfigurationRepository.save(userConfigurationWith("auth0|59ac17508f649c3f85124ec1", LocalDate.of(2018, 4, 13), 36L)))
        .block();

      userConfigurationRepository.findByUserId("auth0|59cc17a23b09c52496036107")
        .switchIfEmpty(userConfigurationRepository.save(userConfigurationWith("auth0|59cc17a23b09c52496036107", LocalDate.of(2017, 10, 30), 36L)))
        .block();
    };
  }

  private UserConfiguration userConfigurationWith(String userId, LocalDate beginOfOvertimeCalculation, long workingHoursPerWeek) {
    return UserConfiguration.builder()
      .userId(userId)
      .workTimeConfiguration(WorkTimeConfiguration.builder()
        .beginOfOvertimeCalculation(beginOfOvertimeCalculation)
        .workingHoursPerWeek(workingHoursPerWeek)
        .build())
      .build();
  }
}
