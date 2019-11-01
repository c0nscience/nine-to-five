package io.ntf.api.infrastructure.jwt.authentication

import com.auth0.jwt.JWTVerifier
import com.auth0.jwt.exceptions.JWTVerificationException
import org.springframework.security.core.Authentication

interface JwtAuthentication {

    val token: String

    val keyId: String

    @Throws(JWTVerificationException::class)
    fun verify(verifier: JWTVerifier): Authentication
}
