package io.ntf.api.infrastructure.jwt

import io.ntf.api.infrastructure.jwt.authentication.PreAuthenticatedAuthenticationJsonWebToken
import org.slf4j.Logger
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.core.context.SecurityContextHolder

/**
 * @author Sebastien Astie
 */
object TokenUtils {
    fun tokenFromHeader(authorizationHeader: String?): String? {
        if (authorizationHeader == null || !authorizationHeader.toLowerCase().startsWith("bearer")) {
            return null
        }

        val parts = authorizationHeader.split(" ".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()

        return if (parts.size < 2) {
            null
        } else parts[1].trim { it <= ' ' }

    }


    fun createSecurityContext(token: String?, logger: Logger): SecurityContext {
        val context = SecurityContextHolder.createEmptyContext()
        val authentication = PreAuthenticatedAuthenticationJsonWebToken.usingToken(token)
        if (authentication != null) {
            context.authentication = authentication
            logger.debug("Found bearer token in request. Saving it in SecurityContext")
        }
        return context
    }
}
