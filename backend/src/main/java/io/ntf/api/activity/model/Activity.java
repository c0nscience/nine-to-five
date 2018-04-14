package io.ntf.api.activity.model;

import lombok.*;
import lombok.experimental.Wither;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Activity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String userId;

  private String name;

  private LocalDateTime start;

  @Column(name = "\"end\"")
  private LocalDateTime end;

}
