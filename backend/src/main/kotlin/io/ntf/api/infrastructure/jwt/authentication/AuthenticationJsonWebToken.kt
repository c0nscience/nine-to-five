package io.ntf.api.infrastructure.jwt.authentication

import com.auth0.jwt.JWT
import com.auth0.jwt.JWTVerifier
import com.auth0.jwt.exceptions.JWTVerificationException
import com.auth0.jwt.interfaces.DecodedJWT
import io.ntf.api.logger
import org.springframework.security.core.Authentication
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import java.util.*

class AuthenticationJsonWebToken internal constructor(token: String, verifier: JWTVerifier?) : Authentication, JwtAuthentication {
  private val decoded: DecodedJWT = if (verifier == null) JWT.decode(token) else verifier.verify(token)
private val log = logger()
  private var authenticated: Boolean = false
  override val token: String = decoded.token
  override val keyId: String = decoded.keyId

  init {
    this.authenticated = verifier != null
  }

  @Throws(JWTVerificationException::class)
  override fun verify(verifier: JWTVerifier): Authentication {
    return AuthenticationJsonWebToken(token, verifier)
  }

  override fun getAuthorities(): Collection<GrantedAuthority> {
    val scope = decoded.getClaim("scope").asString()
    if (scope == null || scope.trim { it <= ' ' }.isEmpty()) {
      return ArrayList()
    }
    val scopes = scope.split(" ".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
    val authorities = ArrayList<SimpleGrantedAuthority>(scopes.size)
    for (value in scopes) {
      authorities.add(SimpleGrantedAuthority(value))
    }
    return authorities
  }

  override fun getCredentials(): Any {
    return decoded.token
  }

  override fun getDetails(): Any {
    return decoded
  }

  override fun getPrincipal(): Any {
    return decoded.subject
  }

  override fun isAuthenticated(): Boolean {
    log.info("isAuthenticated: $authenticated")
    return authenticated
  }

  @Throws(IllegalArgumentException::class)
  override fun setAuthenticated(isAuthenticated: Boolean) {
    require(!isAuthenticated) { "Must create a new instance to specify that the authentication is valid" }
    this.authenticated = false
  }

  override fun getName(): String {
    return decoded.subject
  }
}
