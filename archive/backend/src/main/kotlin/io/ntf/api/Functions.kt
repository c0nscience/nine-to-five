package io.ntf.api

import reactor.core.publisher.Mono
import java.security.Principal

fun Mono<Principal>.name(): Mono<String> {
  return map { it.name }
}
