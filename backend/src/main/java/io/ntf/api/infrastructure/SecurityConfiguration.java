package io.ntf.api.infrastructure;

import io.ntf.api.infrastructure.jwt.JwtWebSecurityConfigurer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

import static org.springframework.http.HttpMethod.*;

@EnableWebFluxSecurity
@Configuration
public class SecurityConfiguration {

  private final Auth0ConfigurationProperties auth0ConfigurationProperties;

  @Autowired
  public SecurityConfiguration(Auth0ConfigurationProperties auth0ConfigurationProperties) {
    this.auth0ConfigurationProperties = auth0ConfigurationProperties;
  }

  @Bean
  public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
    String issuer = auth0ConfigurationProperties.getIssuer();
    String audience = auth0ConfigurationProperties.getAudience();

    //@formatter:off
    JwtWebSecurityConfigurer.forRS256(audience, issuer)
      .configure(http)
      .csrf().disable()
      .authorizeExchange()
        .pathMatchers(POST, "/activity").hasAuthority("start:activity")
        .pathMatchers(POST, "/activity/stop").hasAuthority("stop:activity")
        .pathMatchers(GET, "/activity/running").hasAuthority("read:activities")
        .pathMatchers(PUT, "/activity/{id}").hasAuthority("update:activity")
        .pathMatchers(DELETE, "/activity/{id}").hasAuthority("delete:activity")
        .pathMatchers(DELETE, "/activity/{id}").hasAuthority("delete:activity")
        .pathMatchers(GET, "/activities").hasAuthority("read:activities")
        .pathMatchers(GET, "/logs").hasAuthority("read:logs")
        .pathMatchers(POST, "/log").hasAuthority("create:log")

        .pathMatchers(GET, "/statistics/overtime").hasAuthority("read:overtime")

        .pathMatchers(OPTIONS).permitAll();
    //@formatter:off

    return http.build();
  }

}
