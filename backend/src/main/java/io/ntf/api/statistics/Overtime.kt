package io.ntf.api.statistics;

import lombok.*;
import lombok.experimental.Wither;

import java.time.Duration;
import java.time.LocalDate;

@Builder
@Wither
@AllArgsConstructor
@Getter
@EqualsAndHashCode
@ToString
class Overtime {
  private LocalDate week;
  private Duration totalWorkTime;
  private Duration overtime;
  private Duration totalOvertime = Duration.ZERO;
}
