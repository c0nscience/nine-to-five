package io.ntf.api.infrastructure.jwt;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.server.context.ServerSecurityContextRepository;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
public class BearerReactiveSecurityConextRepository implements ServerSecurityContextRepository {

  @Override
  public Mono<Void> save(ServerWebExchange exchange, SecurityContext context) {
    return Mono.empty();
  }

  @Override
  public Mono<SecurityContext> load(ServerWebExchange exchange) {
    String token = tokenFromRequest(exchange.getRequest());
    return Mono.justOrEmpty(TokenUtils.createSecurityContext(token, log));
  }


  private String tokenFromRequest(ServerHttpRequest request) {
    return TokenUtils.tokenFromHeader(request.getHeaders()
      .getFirst(HttpHeaders.AUTHORIZATION));
  }


}
