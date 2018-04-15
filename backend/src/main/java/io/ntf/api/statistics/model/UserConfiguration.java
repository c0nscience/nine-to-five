package io.ntf.api.statistics.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document
@Data
public class UserConfiguration {

  @Id
  private String userId;

  private WorkTimeConfiguration workTimeConfiguration;

  @Document
  @Data
  public static class WorkTimeConfiguration {
    private LocalDate beginOfOvertimeCalculation;
    private Long workingHoursPerWeek;
  }
}
