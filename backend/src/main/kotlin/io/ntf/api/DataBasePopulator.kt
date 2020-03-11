package io.ntf.api

import io.ntf.api.activity.model.Activity
import io.ntf.api.activity.model.ActivityRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.stereotype.Component
import reactor.core.publisher.Flux
import java.time.LocalDateTime

@Component
class DataBasePopulator(private val activityRepository: ActivityRepository) : CommandLineRunner {

  private val log = LoggerFactory.getLogger(javaClass)

  override fun run(vararg args: String?) {
    val now = LocalDateTime.now()
    val activityTemplate = Activity(userId = "auth0|59ac17508f649c3f85124ec1", name = "template", start = now)
    Flux.just(
      activityTemplate.copy(name = "activity one", start = now.minusMonths(1).minusHours(1), end = now.minusMonths(1)),
      activityTemplate.copy(name = "activity two", start = now.minusMonths(1).minusHours(2), end = now.minusMonths(1)),
      activityTemplate.copy(name = "activity three", start = now.minusMonths(1).plusHours(1), end = now.minusMonths(1).plusHours(2)),
      activityTemplate.copy(name = "activity four", start = now.minusMonths(1).plusHours(2), end = now.minusMonths(1).plusHours(3)),
      activityTemplate.copy(name = "activity five", start = now.minusMonths(0).minusHours(1), end = now.minusMonths(0)),
      activityTemplate.copy(name = "activity seven", start = now.minusMonths(0).plusHours(0), end = now.minusMonths(0).plusHours(1)),
      activityTemplate.copy(name = "activity eight", start = now.minusMonths(0).plusHours(2), end = now.minusMonths(0).plusHours(3)),
      activityTemplate.copy(name = "activity nine", start = now.minusMonths(0).plusHours(3), end = now.minusMonths(0).plusHours(4).plusMinutes(10)),
      activityTemplate.copy(name = "activity ten", start = now.minusMonths(0).plusHours(4), end = now.minusMonths(0).plusHours(5).plusMinutes(25))
    )
      .flatMap { activityRepository.save(it) }
      .subscribe { log.info("id: ${it.id}") }
  }
}
