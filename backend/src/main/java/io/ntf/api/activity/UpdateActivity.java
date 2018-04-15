package io.ntf.api.activity;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Optional;

@Data
class UpdateActivity {
  private String id;
  private String name;
  private LocalDateTime start;
  private Optional<LocalDateTime> end;
}
