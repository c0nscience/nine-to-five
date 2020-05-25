package io.ntf.api

import io.ntf.api.activity.model.ActivityRepository
import io.ntf.api.fixtures.createActivitiesFrom
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.stereotype.Component
import reactor.kotlin.core.publisher.toFlux
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit

//@Component
class DataBasePopulator(private val activityRepository: ActivityRepository) : CommandLineRunner {

  private val log = LoggerFactory.getLogger(javaClass)

  override fun run(vararg args: String?) {
    createActivitiesFrom(
      userId = "auth0|59ac17508f649c3f85124ec1",
      weeks = 5,
      dailyOvertime = 30,
      now = { LocalDateTime.now().minusWeeks(4).withHour(8).withMinute(0).truncatedTo(ChronoUnit.MINUTES) },
      tags = listOf("acme", "meeting")
    )
      .toFlux()
      .flatMap { activityRepository.save(it) }
      .subscribe { log.info("id: ${it.id}") }
  }
}
