package io.ntf.api.infrastructure.jwt

import com.auth0.jwk.*
import com.auth0.jwt.JWT
import com.auth0.jwt.JWTVerifier
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.exceptions.JWTVerificationException
import io.ntf.api.infrastructure.jwt.authentication.JwtAuthentication
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.AuthenticationProvider
import org.springframework.security.authentication.AuthenticationServiceException
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.core.Authentication
import org.springframework.security.core.AuthenticationException

import java.security.interfaces.RSAPublicKey

class JwtAuthenticationProvider : AuthenticationProvider {

    private val secret: ByteArray?
    private val issuer: String
    private val audience: String
    private val jwkProvider: JwkProvider?

    constructor(secret: ByteArray, issuer: String, audience: String) {
        this.secret = secret
        this.issuer = issuer
        this.audience = audience
        this.jwkProvider = null
    }

    constructor(jwkProvider: JwkProvider, issuer: String, audience: String) {
        this.jwkProvider = jwkProvider
        this.secret = null
        this.issuer = issuer
        this.audience = audience
    }

    override fun supports(authentication: Class<*>): Boolean {
        return JwtAuthentication::class.java.isAssignableFrom(authentication)
    }

    @Throws(AuthenticationException::class)
    override fun authenticate(authentication: Authentication): Authentication? {
        if (!supports(authentication.javaClass)) {
            return null
        }

        val jwt = authentication as JwtAuthentication
        try {
            return jwt.verify(jwtVerifier(jwt))
        } catch (e: JWTVerificationException) {
            throw BadCredentialsException("Not a valid token", e)
        }

    }

    @Throws(AuthenticationException::class)
    private fun jwtVerifier(authentication: JwtAuthentication): JWTVerifier {
        if (secret != null) {
            return providerForHS256(secret, issuer, audience)
        }
        val kid = authentication.keyId ?: throw BadCredentialsException("No kid found in jwt")
        if (jwkProvider == null) {
            throw AuthenticationServiceException("Missing jwk provider")
        }
        try {
            val jwk = jwkProvider.get(kid)
            return providerForRS256(jwk.publicKey as RSAPublicKey, issuer, audience)
        } catch (e: SigningKeyNotFoundException) {
            throw AuthenticationServiceException("Could not retrieve jwks from issuer", e)
        } catch (e: InvalidPublicKeyException) {
            throw AuthenticationServiceException("Could not retrieve public key from issuer", e)
        } catch (e: JwkException) {
            throw AuthenticationServiceException("Cannot authenticate with jwt", e)
        }

    }

    companion object {

        private val logger = LoggerFactory.getLogger(JwtAuthenticationProvider::class.java)

        private fun providerForRS256(key: RSAPublicKey, issuer: String, audience: String): JWTVerifier {
            return JWT.require(Algorithm.RSA256(key))
                    .withIssuer(issuer)
                    .withAudience(audience)
                    .build()
        }

        private fun providerForHS256(secret: ByteArray, issuer: String, audience: String): JWTVerifier {
            return JWT.require(Algorithm.HMAC256(secret))
                    .withIssuer(issuer)
                    .withAudience(audience)
                    .build()
        }
    }
}
