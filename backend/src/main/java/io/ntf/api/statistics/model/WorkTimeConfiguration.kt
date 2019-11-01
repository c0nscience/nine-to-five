package io.ntf.api.statistics.model;

import lombok.*;
import lombok.experimental.Wither;

import java.time.LocalDate;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Wither
public class WorkTimeConfiguration {
  private LocalDate beginOfOvertimeCalculation;
  private Long workingHoursPerWeek;
}
