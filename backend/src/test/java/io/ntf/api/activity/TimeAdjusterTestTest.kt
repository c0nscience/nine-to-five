package io.ntf.api.activity

import org.assertj.core.api.SoftAssertions
import org.junit.Test
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime


class TimeAdjusterTestTest: TimeTrait {

  private val testValues = listOf(
    Pair(13, 10),
    Pair(16, 20),
    Pair(26, 30),
    Pair(23, 20),
    Pair(33, 30),
    Pair(45, 50)
  )

  @Test
  fun shouldRoundLessThen5DownToNearestTenth() {
    val assertions = testValues.fold(SoftAssertions()) { assertions, p ->
      val (value, expectedValue) = p

      val time = LocalDateTime.of(LocalDate.now(), LocalTime.of(16, value, 0))

      val roundedTime = time.with(adjustToNearestTenth())
      assertions.assertThat(roundedTime).isEqualTo(LocalDateTime.of(LocalDate.now(), LocalTime.of(16, expectedValue, 0)))
      assertions
    }

    assertions.assertAll()


  }

}
