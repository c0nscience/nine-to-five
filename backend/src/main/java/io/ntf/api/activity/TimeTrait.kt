package io.ntf.api.activity

import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.temporal.ChronoField
import java.time.temporal.ChronoUnit
import java.time.temporal.Temporal

interface TimeTrait {

  private val roundingThreshold: Long get() = 5

  fun now(): LocalDateTime {
    return LocalDateTime.now(ZoneOffset.UTC)
      .truncatedTo(ChronoUnit.MINUTES)
      .with(adjustToNearestTenth())
  }

  fun adjustToNearestTenth(): (Temporal) -> Temporal {
    return { temporal: Temporal ->
      val minute = temporal.get(ChronoField.MINUTE_OF_HOUR)
      val remainder = minute % roundingThreshold
      val adjustBy = if (remainder < 3) {
        remainder * -1
      } else {
        roundingThreshold - remainder
      }
      temporal.plus(adjustBy, ChronoUnit.MINUTES)
    }
  }
}
