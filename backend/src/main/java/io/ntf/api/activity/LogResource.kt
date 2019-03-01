package io.ntf.api.activity

import io.ntf.api.activity.model.Log
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.ResponseEntity.*
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.core.publisher.Mono.*
import java.security.Principal

@RestController
class LogResource(private val logService: LogService) {

  @GetMapping("/logs")
  fun all(principal: Mono<Principal>): Flux<Log> {
    return principal.map { it.name }
      .flatMapMany { logService.findByUserId(it) }
  }

  @PostMapping("/log")
  fun create(@RequestBody newLog: Mono<NewLog>, principal: Mono<Principal>): Mono<ResponseEntity<Log>> {
    return principal.map { it.name }
      .zipWith(newLog)
      .flatMap { logService.create(it.t1, it.t2) }
      .map { status(HttpStatus.CREATED).body(it) }
  }

  @PutMapping("/log/{id}")
  fun update(@PathVariable("id") id: String, @RequestBody updatedLog: Mono<UpdatedLog>, principal: Mono<Principal>): Mono<ResponseEntity<Log>> {
    return principal.map { it.name }
      .zipWith(updatedLog)
      .flatMap { logService.update(id, it.t1, it.t2) }
      .map { ok(it) }
      .switchIfEmpty(just(notFound().build()))
  }

  @DeleteMapping("/log/{id}")
  fun delete(@PathVariable("id") id: String, principal: Mono<Principal>): Mono<ResponseEntity<DeletedLog>> {
    return principal.map { it.name }
      .flatMap { logService.delete(id, it) }
      .map { ok(DeletedLog(id)) }
      .switchIfEmpty(just(status(HttpStatus.CONFLICT).build()))
  }

  data class DeletedLog(val id: String)
}
