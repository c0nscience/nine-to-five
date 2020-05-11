package io.ntf.api.infrastructure

import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod.*
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator
import org.springframework.security.oauth2.jwt.*
import org.springframework.security.web.server.SecurityWebFilterChain

@EnableWebFluxSecurity
@Configuration
@EnableConfigurationProperties(Auth0ConfigurationProperties::class)
class SecurityConfiguration(private val auth0ConfigurationProperties: Auth0ConfigurationProperties) {

  @Bean
  fun securityWebFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain =
    http
      .authorizeExchange()
      .pathMatchers(OPTIONS).permitAll()
//TODO fix scopes
      .pathMatchers(POST, "/activity").hasAuthority("SCOPE_start:activity")
      .pathMatchers(POST, "/activity/stop").hasAuthority("SCOPE_stop:activity")
      .pathMatchers(GET, "/activity/running").hasAuthority("SCOPE_read:activities")
      .pathMatchers(PUT, "/activity/{id}").hasAuthority("SCOPE_update:activity")
      .pathMatchers(DELETE, "/activity/{id}").hasAuthority("SCOPE_delete:activity")
      .pathMatchers(DELETE, "/activity/{id}").hasAuthority("SCOPE_delete:activity")
      .pathMatchers(GET, "/activities").hasAuthority("SCOPE_read:activities")
      .pathMatchers(GET, "/activities/{from}/{to}").hasAuthority("SCOPE_read:activities")
      .pathMatchers(HEAD, "/activities").hasAuthority("SCOPE_read:activities")
      .pathMatchers(GET, "/activities/tags").hasAuthority("SCOPE_read:activities")
      .pathMatchers(DELETE, "/activities").hasAuthority("SCOPE_delete:activity")

      .pathMatchers(GET, "/statistics/overtime").hasAuthority("SCOPE_read:overtime")

      .pathMatchers(GET, "/statistic/configurations").hasAuthority("SCOPE_read:overtime")
      .pathMatchers(POST, "/statistic/configurations").hasAuthority("SCOPE_read:overtime")
      .pathMatchers(PUT, "/statistic/configurations").hasAuthority("SCOPE_read:overtime")

      .pathMatchers(GET, "/metrics").hasAuthority("SCOPE_read:metrics")
      .pathMatchers(POST, "/metrics").hasAuthority("SCOPE_create:metrics")
      .and()
      .oauth2ResourceServer().jwt().and().and().build()

  @Bean
  fun jwtDecoder(): ReactiveJwtDecoder {
    val issuer = auth0ConfigurationProperties.issuer
    val audience = auth0ConfigurationProperties.audience

    val jwtDecoder = ReactiveJwtDecoders.fromOidcIssuerLocation(issuer) as NimbusReactiveJwtDecoder

    val audienceValidator = AudienceValidator(audience)
    val withIssuer = JwtValidators.createDefaultWithIssuer(issuer)
    val withAudience = DelegatingOAuth2TokenValidator(withIssuer, audienceValidator, JwtTimestampValidator())

    jwtDecoder.setJwtValidator(withAudience)

    return jwtDecoder
  }

}
