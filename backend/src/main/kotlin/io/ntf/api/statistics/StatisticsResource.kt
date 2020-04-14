package io.ntf.api.statistics

import io.ntf.api.statistics.model.StatisticConfiguration
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

import java.security.Principal

@RestController
class StatisticsResource(private val statisticsService: StatisticsService) {

  @GetMapping("/statistics/overtime")
  fun overtime(principal: Mono<Principal>): Mono<Map<String, List<Overtime>>> {
    return principal.map { it.name }
      .flatMap { statisticsService.overtime(it) }
  }

  @PutMapping("/statistic/configurations")
  fun updateConfiguration(@RequestBody statisticConfiguration: UpdateStatisticConfiguration, principal: Mono<Principal>): Mono<StatisticConfiguration> {
    return principal.map { it.name }
      .flatMap { statisticsService.updateConfiguration(it, statisticConfiguration) }
  }

  @GetMapping("statistic/configurations")
  fun getAllConfigurations(principal: Mono<Principal>): Mono<List<StatisticConfiguration>> {
    return principal.map { it.name }
      .flatMap { statisticsService.findAllById(it) }
  }

}
