package io.ntf.api.activity

import io.ntf.api.activity.model.Activity
import io.ntf.api.logger
import io.ntf.api.name
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.kotlin.core.util.function.component1
import reactor.kotlin.core.util.function.component2
import java.security.Principal
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit


@RestController
class ActivityResource(private val activityService: ActivityService) {

  private val log = logger()

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

  @GetMapping("/activities/{from}/{to}")
  fun allInRange(
    principal: Mono<Principal>,
    @PathVariable from: String,
    @PathVariable to: String
  ): Mono<Map<String, Any>> {
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

  @GetMapping("/activities/{id}")
  fun getActivity(principal: Mono<Principal>, @PathVariable id: String): Mono<ActivityDetail> {
    return principal.name()
      .flatMap { userId -> activityService.findByUserIdAndId(userId, id) }
      .map { activity ->
        ActivityDetail(
          id = activity.id!!,
          name = activity.name,
          start = activity.start,
          end = activity.end,
          tags = activity.tags
        )
      }
  }

  @PostMapping("/activity")
  fun start(
    @RequestBody startActivity: Mono<StartActivity>,
    principal: Mono<Principal>
  ): Mono<ResponseEntity<Activity>> {
    return principal.map { it.name }
      .zipWith(startActivity)
      .flatMap { (userId, activity) -> activityService.start(userId, activity.name, activity.start, activity.tags) }
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
  fun update(
    @PathVariable("id") id: String,
    @RequestBody updateActivity: Mono<UpdateActivity>,
    principal: Mono<Principal>
  ): Mono<Activity> {
    return principal.map { it.name }
      .zipWith(updateActivity)
      .flatMap { (userId, activity) -> activityService.update(userId, activity) }
      .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND)))
  }

  @DeleteMapping("/activity/{id}")
  fun delete(@PathVariable("id") id: String, principal: Mono<Principal>): Mono<DeletedActivity> {
    return principal.map { it.name }
      .flatMap { userId -> activityService.delete(userId, id) }
      .map { (id1, _, _, start) -> DeletedActivity(id = id1, start = start) }
      .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND)))
  }

  @DeleteMapping("/activities")
  fun deleteAll(@RequestBody idsToDelete: Mono<List<String>>, principal: Mono<Principal>): Mono<ResponseEntity<Void>> {
    return principal.map { it.name }
      .flatMap { userId -> activityService.deleteAll(userId, idsToDelete) }
      .thenReturn(ResponseEntity.noContent().build<Void>())
  }

  @GetMapping("/activities/tags")
  fun getAllTags(principal: Mono<Principal>): Mono<List<String>> {
    return principal.map { it.name }
      .flatMap { activityService.findAllUsedTags(it).collectList() }
  }

  @PostMapping("/activity/repeat")
  fun repeat(
    @RequestBody activityWithConfig: Mono<ActivityWithConfig>,
    principal: Mono<Principal>
  ): Mono<ResponseEntity<Void>> {
    return principal.map { it.name }
      .zipWith(activityWithConfig)
      .flatMap { (userId, awc) ->
        val (activity, config) = awc
        val d = ChronoUnit.DAYS.between(config.from, config.to.plusDays(1))

        Flux.range(0, d.toInt())
          .map { config.from.plusDays(it.toLong()) }
          .filter { it.dayOfWeek.value in config.selectedDays }
          .flatMap { activityService.create(userId = userId, name = activity.name, start = LocalDateTime.of(it, activity.start), end = LocalDateTime.of(it, activity.end), tags = activity.tags) }
          .then()
      }
      .thenReturn(ResponseEntity.status(HttpStatus.CREATED).build())
  }

  data class StartActivity(val name: String, val start: LocalDateTime?, val tags: List<String> = emptyList())

  data class DeletedActivity(val id: String?, val start: LocalDateTime)

  data class ActivityDetail(
    val id: String,
    val name: String,
    val start: LocalDateTime,
    val end: LocalDateTime?,
    val tags: List<String> = emptyList()
  )

  data class ActivityWithConfig(
    val activity: RepeatActivity,
    val config: RepeatConfig
  )

  data class RepeatActivity(
    val name: String,
    val tags: List<String> = emptyList(),
    val start: LocalTime,
    val end: LocalTime
  )

  data class RepeatConfig(
    val from: LocalDate,
    val to: LocalDate,
    val selectedDays: List<Int> = emptyList()
  )
}
