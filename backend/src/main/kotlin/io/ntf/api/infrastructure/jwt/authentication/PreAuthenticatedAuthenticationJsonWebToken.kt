package io.ntf.api.infrastructure.jwt.authentication

import com.auth0.jwt.JWT
import com.auth0.jwt.JWTVerifier
import com.auth0.jwt.exceptions.JWTDecodeException
import com.auth0.jwt.exceptions.JWTVerificationException
import com.auth0.jwt.interfaces.DecodedJWT
import io.ntf.api.infrastructure.jwt.JwtAuthenticationProvider
import org.slf4j.LoggerFactory
import org.springframework.security.core.Authentication
import org.springframework.security.core.GrantedAuthority

class PreAuthenticatedAuthenticationJsonWebToken internal constructor(private val decodedJWT: DecodedJWT) : Authentication, JwtAuthentication {

  override val token: String = decodedJWT.token
  override val keyId: String = decodedJWT.keyId

  override fun getAuthorities(): Collection<GrantedAuthority> {
    return emptyList()
  }

  override fun getCredentials(): Any {
    return decodedJWT.token
  }

  override fun getDetails(): Any {
    return decodedJWT
  }

  override fun getPrincipal(): Any {
    return decodedJWT.subject
  }

  override fun isAuthenticated(): Boolean {
    return false
  }

  @Throws(IllegalArgumentException::class)
  override fun setAuthenticated(isAuthenticated: Boolean) {

  }

  override fun getName(): String {
    return decodedJWT.subject
  }

  @Throws(JWTVerificationException::class)
  override fun verify(verifier: JWTVerifier): Authentication {
    return AuthenticationJsonWebToken(decodedJWT.token, verifier)
  }

  companion object {

    private val logger = LoggerFactory.getLogger(JwtAuthenticationProvider::class.java)

    fun usingToken(token: String?): PreAuthenticatedAuthenticationJsonWebToken? {
      if (token == null) {
        logger.debug("No token was provided to build {}", PreAuthenticatedAuthenticationJsonWebToken::class.java.name)
        return null
      }
      return try {
        val jwt = JWT.decode(token)
        PreAuthenticatedAuthenticationJsonWebToken(jwt)
      } catch (e: JWTDecodeException) {
        logger.debug("Failed to decode token as jwt", e)
        null
      }

    }
  }
}
