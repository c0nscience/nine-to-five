package io.ntf.api.infrastructure.jwt

import org.slf4j.LoggerFactory
import org.springframework.http.HttpHeaders
import org.springframework.http.server.reactive.ServerHttpRequest
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.web.server.context.ServerSecurityContextRepository
import org.springframework.web.server.ServerWebExchange
import reactor.core.publisher.Mono

class BearerReactiveSecurityConextRepository : ServerSecurityContextRepository {

  private val log = LoggerFactory.getLogger(javaClass)

  override fun save(exchange: ServerWebExchange, context: SecurityContext): Mono<Void> {
    return Mono.empty()
  }

  override fun load(exchange: ServerWebExchange): Mono<SecurityContext> {
    val token = tokenFromRequest(exchange.request)
    return Mono.justOrEmpty(TokenUtils.createSecurityContext(token, log))
  }


  private fun tokenFromRequest(request: ServerHttpRequest): String? {
    return TokenUtils.tokenFromHeader(request.headers
      .getFirst(HttpHeaders.AUTHORIZATION))
  }


}
