package io.ntf.api.activity

import org.assertj.core.api.SoftAssertions
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime


class TimeAdjusterTestTest: TimeTrait {

  private val testValues = listOf(
    Pair(3, 5),
    Pair(2, 0),
    Pair(6, 5),
    Pair(13, 15),
    Pair(16, 15),
    Pair(22, 20),
    Pair(23, 25),
    Pair(26, 25),
    Pair(33, 35),
    Pair(45, 45)
  )

  @Test
  fun shouldRoundLessThen5DownToNearestTenth() {
    val assertions = testValues.fold(SoftAssertions()) { assertions, p ->
      val (value, expectedValue) = p

      val time = LocalDateTime.of(LocalDate.now(), LocalTime.of(16, value, 0))

      val roundedTime = time.adjustToNearestTenth()
      assertions.assertThat(roundedTime).isEqualTo(LocalDateTime.of(LocalDate.now(), LocalTime.of(16, expectedValue, 0)))
      assertions
    }

    assertions.assertAll()


  }

}
