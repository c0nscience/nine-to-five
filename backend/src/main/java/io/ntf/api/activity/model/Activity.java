package io.ntf.api.activity.model;

import io.vavr.control.Option;
import lombok.*;
import lombok.experimental.Wither;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Duration;
import java.time.LocalDateTime;

@Document(collection = "activities")
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Wither
public class Activity {

  @Id
  private String id;

  private String userId;

  private String name;

  private LocalDateTime start;

  private LocalDateTime end;

  public Duration duration() {
    return Duration.between(start, Option.of(end).getOrElse(LocalDateTime.now()));
  }

}
