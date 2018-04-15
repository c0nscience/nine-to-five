package io.ntf.api.statistics;

import io.vavr.collection.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.security.Principal;

@RestController
public class StatisticsResource {

  private final StatisticsService statisticsService;

  public StatisticsResource(StatisticsService statisticsService) {
    this.statisticsService = statisticsService;
  }

  @GetMapping("/statistics/overtime")
  public Mono<List<Overtime>> overtime(Mono<Principal> principal) {
    return principal.map(Principal::getName)
      .flatMap(statisticsService::overtime);
  }

}
