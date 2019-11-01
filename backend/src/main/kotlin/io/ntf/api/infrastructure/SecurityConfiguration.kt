package io.ntf.api.infrastructure

import io.ntf.api.infrastructure.jwt.JwtWebSecurityConfigurer
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod.*
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.web.server.SecurityWebFilterChain

@EnableWebFluxSecurity
@Configuration
@EnableConfigurationProperties(Auth0ConfigurationProperties::class)
class SecurityConfiguration(private val auth0ConfigurationProperties: Auth0ConfigurationProperties) {

  @Bean
  fun securityWebFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
    val issuer = auth0ConfigurationProperties.issuer
    val audience = auth0ConfigurationProperties.audience

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
      .pathMatchers(PUT, "/log/{id}").hasAuthority("update:log")

      .pathMatchers(GET, "/statistics/overtime").hasAuthority("read:overtime")

      .pathMatchers(OPTIONS).permitAll()

    return http.build()
  }

}
