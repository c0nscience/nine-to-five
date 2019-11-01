package io.ntf.api.statistics

import java.time.Duration
import java.time.LocalDate

data class Overtime(val week: LocalDate,
                    val totalWorkTime: Duration,
                    val overtime: Duration,
                    val totalOvertime: Duration? = Duration.ZERO)
