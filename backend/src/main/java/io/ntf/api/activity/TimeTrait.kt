package io.ntf.api.activity

import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.temporal.ChronoField
import java.time.temporal.ChronoUnit
import java.time.temporal.Temporal

interface TimeTrait {

  fun now(): LocalDateTime {
    return LocalDateTime.now(ZoneOffset.UTC)
      .truncatedTo(ChronoUnit.MINUTES)
      .with(adjustToNearestTenth())
  }

  fun adjustToNearestTenth(): (Temporal) -> Temporal {
    return { temporal: Temporal ->
      val minute = temporal.get(ChronoField.MINUTE_OF_HOUR)
      val remainder = (minute % 10).toLong()
      val adjustBy = if (remainder < 5) {
        remainder * -1
      } else {
        10 - remainder
      }
      temporal.plus(adjustBy, ChronoUnit.MINUTES)
    }
  }
}
