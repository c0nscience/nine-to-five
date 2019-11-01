package io.ntf.api.infrastructure.jwt

import org.springframework.http.HttpStatus
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.server.ServerAuthenticationEntryPoint
import org.springframework.web.server.ServerWebExchange
import reactor.core.publisher.Mono

class JwtReactiveAuthenticationEntryPoint : ServerAuthenticationEntryPoint {
  override fun commence(exchange: ServerWebExchange, e: AuthenticationException): Mono<Void> {
    exchange.response.statusCode = HttpStatus.UNAUTHORIZED
    return Mono.empty()
  }
}
