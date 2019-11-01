package io.ntf.api.infrastructure;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties("auth0")
@Data
public class Auth0ConfigurationProperties {
  private String issuer;

  private String audience;
}
