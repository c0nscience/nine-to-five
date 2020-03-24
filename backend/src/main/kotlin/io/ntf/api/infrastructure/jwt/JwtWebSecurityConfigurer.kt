package io.ntf.api.infrastructure.jwt

import com.auth0.jwk.JwkProviderBuilder
import org.apache.commons.codec.binary.Base64
import org.springframework.security.authentication.AuthenticationProvider
import org.springframework.security.authentication.ReactiveAuthenticationManager
import org.springframework.security.config.web.server.SecurityWebFiltersOrder
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.web.server.authentication.AuthenticationWebFilter
import org.springframework.security.web.server.authorization.ExceptionTranslationWebFilter
import reactor.core.publisher.Mono

/**
 * Utility class for configuring Security for your Spring Reactive API
 *
 * @author Sebastien Astie
 */
class JwtWebSecurityConfigurer private constructor(internal val audience: String, internal val issuer: String, internal val provider: AuthenticationProvider) {

    /**
     * Further configure the [ServerHttpSecurity] object with some sensible defaults
     * by registering objects to obtain a bearer token from a request.
     *
     * @param http configuration for Spring
     * @return the http configuration for further customizations
     * @throws Exception
     */
    fun configure(http: ServerHttpSecurity): ServerHttpSecurity {
        val authenticationManager = ReactiveAuthenticationManager { authentication -> try {
            Mono.justOrEmpty(provider.authenticate(authentication))
          } catch (t: Throwable) {
            Mono.error(t)
          }
        }
        val exceptionHandling = ExceptionTranslationWebFilter()
        exceptionHandling.setAuthenticationEntryPoint(JwtReactiveAuthenticationEntryPoint())
        val authenticationWebFilter = AuthenticationWebFilter(authenticationManager)
        authenticationWebFilter.setServerAuthenticationConverter(JwtAuthenticationConverter())

        return http
                .httpBasic().disable()
                .formLogin().disable()
                .logout().disable()
                .addFilterAt(exceptionHandling, SecurityWebFiltersOrder.EXCEPTION_TRANSLATION)
                .addFilterAt(authenticationWebFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                .authenticationManager(authenticationManager)
                .securityContextRepository(BearerReactiveSecurityConextRepository())

    }

    companion object {

        /**
         * Configures application authorization for JWT signed with RS256.
         * Will try to validate the token using the public key downloaded from "$issuer/.well-known/jwks.json"
         * and matched by the value of `kid` of the JWT header
         *
         * @param audience identifier of the API and must match the `aud` value in the token
         * @param issuer   of the token for this API and must match the `iss` value in the token
         * @return JwtWebSecurityConfigurer for further configuration
         */
        fun forRS256(audience: String, issuer: String): JwtWebSecurityConfigurer {
            val jwkProvider = JwkProviderBuilder(issuer).build()
            return JwtWebSecurityConfigurer(audience, issuer, JwtAuthenticationProvider(jwkProvider, issuer, audience))
        }

        /**
         * Configures application authorization for JWT signed with RS256
         * Will try to validate the token using the public key downloaded from "$issuer/.well-known/jwks.json"
         * and matched by the value of `kid` of the JWT header
         *
         * @param audience identifier of the API and must match the `aud` value in the token
         * @param issuer   of the token for this API and must match the `iss` value in the token
         * @param provider of Spring Authentication objects that can validate a [com.auth0.spring.security.api.authentication.PreAuthenticatedAuthenticationJsonWebToken]
         * @return JwtWebSecurityConfigurer for further configuration
         */
        fun forRS256(audience: String, issuer: String, provider: AuthenticationProvider): JwtWebSecurityConfigurer {
            return JwtWebSecurityConfigurer(audience, issuer, provider)
        }

        /**
         * Configures application authorization for JWT signed with HS256
         *
         * @param audience identifier of the API and must match the `aud` value in the token
         * @param issuer   of the token for this API and must match the `iss` value in the token
         * @param secret   used to sign and verify tokens encoded in Base64
         * @return JwtWebSecurityConfigurer for further configuration
         */
        fun forHS256WithBase64Secret(audience: String, issuer: String, secret: String): JwtWebSecurityConfigurer {
            val secretBytes = Base64(true).decode(secret)
            return JwtWebSecurityConfigurer(audience, issuer, JwtAuthenticationProvider(secretBytes, issuer, audience))
        }

        /**
         * Configures application authorization for JWT signed with HS256
         *
         * @param audience identifier of the API and must match the `aud` value in the token
         * @param issuer   of the token for this API and must match the `iss` value in the token
         * @param secret   used to sign and verify tokens
         * @return JwtWebSecurityConfigurer for further configuration
         */
        fun forHS256(audience: String, issuer: String, secret: ByteArray): JwtWebSecurityConfigurer {
            return JwtWebSecurityConfigurer(audience, issuer, JwtAuthenticationProvider(secret, issuer, audience))
        }

        /**
         * Configures application authorization for JWT signed with HS256
         *
         * @param audience identifier of the API and must match the `aud` value in the token
         * @param issuer   of the token for this API and must match the `iss` value in the token
         * @param provider of Spring Authentication objects that can validate a [com.auth0.spring.security.api.authentication.PreAuthenticatedAuthenticationJsonWebToken]
         * @return JwtWebSecurityConfigurer for further configuration
         */
        fun forHS256(audience: String, issuer: String, provider: AuthenticationProvider): JwtWebSecurityConfigurer {
            return JwtWebSecurityConfigurer(audience, issuer, provider)
        }
    }
}
