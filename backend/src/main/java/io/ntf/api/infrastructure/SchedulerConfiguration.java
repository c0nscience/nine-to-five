package io.ntf.api.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.util.concurrent.Executors;

@Configuration
public class SchedulerConfiguration {

  @Bean
  public Scheduler jdbcScheduler() {
    return Schedulers.fromExecutor(Executors.newFixedThreadPool(2));
  }

}
