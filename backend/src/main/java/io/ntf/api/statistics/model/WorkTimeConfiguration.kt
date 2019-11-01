package io.ntf.api.statistics.model

import java.time.LocalDate

data class WorkTimeConfiguration(val beginOfOvertimeCalculation: LocalDate,
                                 val workingHoursPerWeek: Long)
