package io.ntf.api.activity

import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.temporal.ChronoField
import java.time.temporal.ChronoUnit

interface TimeTrait {

  private val roundingThreshold: Long get() = 5

  fun now(): LocalDateTime {
    return LocalDateTime.now(ZoneOffset.UTC)
      .truncatedTo(ChronoUnit.MINUTES)
      .adjustToNearestTenth()
  }

  fun LocalDateTime.adjustToNearestTenth(): LocalDateTime {
    val minute = this.get(ChronoField.MINUTE_OF_HOUR)
    val remainder = minute % roundingThreshold
    val adjustBy = if (remainder < 3) {
      remainder * -1
    } else {
      roundingThreshold - remainder
    }

    return this.plus(adjustBy, ChronoUnit.MINUTES)
  }

  fun LocalDateTime.adjustAndTruncate(): LocalDateTime {
    return this.truncatedTo(ChronoUnit.MINUTES)
      .adjustToNearestTenth()
  }

  fun LocalDateTime.isNotAdjusted(): Boolean {
    val minute = this.get(ChronoField.MINUTE_OF_HOUR)
    val seconds = this.get(ChronoField.SECOND_OF_MINUTE)
    val remainder = minute % roundingThreshold
    return remainder > 0 || seconds > 0
  }
}
