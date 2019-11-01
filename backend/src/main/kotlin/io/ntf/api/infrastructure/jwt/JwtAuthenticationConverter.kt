package io.ntf.api.infrastructure.jwt

import io.ntf.api.infrastructure.jwt.authentication.PreAuthenticatedAuthenticationJsonWebToken
import org.springframework.http.HttpHeaders
import org.springframework.security.core.Authentication
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter
import org.springframework.web.server.ServerWebExchange
import reactor.core.publisher.Mono

class JwtAuthenticationConverter : ServerAuthenticationConverter {

    override fun convert(exchange: ServerWebExchange): Mono<Authentication> {
        val token = TokenUtils.tokenFromHeader(exchange.request
                .headers
                .getFirst(HttpHeaders.AUTHORIZATION))
        return Mono.justOrEmpty(PreAuthenticatedAuthenticationJsonWebToken.usingToken(token))
    }
}
