package io.ntf.api.statistics.model;

import lombok.*;
import lombok.experimental.Wither;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "userConfigurations")
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Wither
public class UserConfiguration {

  @Id
  private String id;
  private String userId;
  private WorkTimeConfiguration workTimeConfiguration;

}
