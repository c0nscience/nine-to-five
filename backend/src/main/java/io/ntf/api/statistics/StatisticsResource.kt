package io.ntf.api.statistics

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono

import java.security.Principal

@RestController
class StatisticsResource(private val statisticsService: StatisticsService) {

  @GetMapping("/statistics/overtime")
  fun overtime(principal: Mono<Principal>): Mono<List<Overtime>> {
    return principal.map { it.name }
      .flatMap { statisticsService.overtime(it) }
  }

}
