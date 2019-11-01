package io.ntf.api.infrastructure.jwt;

import io.ntf.api.infrastructure.jwt.authentication.PreAuthenticatedAuthenticationJsonWebToken;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.function.Function;

public class JwtAuthenticationConverter implements Function<ServerWebExchange, Mono<Authentication>> {
  @Override
  public Mono<Authentication> apply(ServerWebExchange serverWebExchange) {
    String token = TokenUtils.tokenFromHeader(serverWebExchange.getRequest()
      .getHeaders()
      .getFirst(HttpHeaders.AUTHORIZATION));
    return Mono.justOrEmpty(PreAuthenticatedAuthenticationJsonWebToken.usingToken(token));
  }
}
