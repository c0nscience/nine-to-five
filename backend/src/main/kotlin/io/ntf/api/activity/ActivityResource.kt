package io.ntf.api.activity

import io.ntf.api.activity.model.Activity
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.kotlin.core.util.function.component1
import reactor.kotlin.core.util.function.component2
import java.security.Principal
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@RestController
class ActivityResource(private val activityService: ActivityService) {

  @GetMapping("/log/{logId}/activities")
  fun allFromLog(@PathVariable("logId") logId: String, principal: Mono<Principal>): Flux<Activity> {
    return principal.map { it.name }
      .flatMapMany { userId -> activityService.findByLogIdAndUserId(logId, userId) }
  }

  @RequestMapping(value = ["/activities"], method = [RequestMethod.HEAD])
  fun headLastModified(principal: Mono<Principal>) =
    principal
      .map { it.name }
      .flatMap { activityService.getLastModifiedDate(it) }
      .map { lastModifiedDate ->
        ResponseEntity.ok()
          .header("Last-Modified", lastModifiedDate.format(DateTimeFormatter.ISO_DATE_TIME))
          .build<Unit>()
      }

  @GetMapping("/activities")
  fun allFromDefault(principal: Mono<Principal>): Mono<Map<String, ActivityService.WeekInformation>> {
    return principal
      .map { it.name }
      .flatMap { name -> activityService.all(name) }
  }

  @GetMapping("/activities/{from}/{to}")
  fun allInRange(principal: Mono<Principal>, @PathVariable from: String, @PathVariable to: String): Mono<Map<String, Any>> {
    return principal.map { it.name }
      .zipWith(principal.flatMap { activityService.countBefore(it.name, LocalDate.parse(from)) })
      .flatMap { (name, remainingEntries) ->
        activityService.allInRange(name, LocalDate.parse(from), LocalDate.parse(to)).collectList()
          .map {
            mapOf(
              "entries" to it,
              "remainingEntries" to remainingEntries
            )
          }
      }
  }

  @PostMapping("/activity")
  fun start(@RequestBody startActivity: Mono<StartActivity>, principal: Mono<Principal>): Mono<ResponseEntity<Activity>> {
    return principal.map { it.name }
      .zipWith(startActivity.map { it.name })
      .flatMap { tpl -> activityService.start(tpl.t1, tpl.t2) }
      .map { activity -> ResponseEntity.status(HttpStatus.CREATED).body(activity) }
  }

  @GetMapping("/activity/running")
  fun running(principal: Mono<Principal>): Mono<Activity> {
    return principal.map { it.name }
      .flatMap { activityService.running(it) }
      .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND)))
  }

  @PostMapping("/activity/stop")
  fun stop(principal: Mono<Principal>): Mono<Activity> {
    return principal.map { it.name }
      .flatMap { activityService.stop(it) }
  }

  @PutMapping("/activity/{id}")
  fun update(@PathVariable("id") id: String, @RequestBody updateActivity: Mono<UpdateActivity>, principal: Mono<Principal>): Mono<Activity> {
    return principal.map { it.name }
      .zipWith(updateActivity)
      .flatMap { tpl -> activityService.update(tpl.t1, tpl.t2) }
      .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND)))
  }

  @DeleteMapping("/activity/{id}")
  fun delete(@PathVariable("id") id: String, principal: Mono<Principal>): Mono<DeletedActivity> {
    return principal.map { it.name }
      .flatMap { userId -> activityService.delete(userId, id) }
      .map { (id1, _, _, _, start) -> DeletedActivity(id = id1, start = start) }
      .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND)))
  }

  data class StartActivity(val name: String)

  data class DeletedActivity(val id: String?, val start: LocalDateTime)
}
