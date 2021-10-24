package io.ntf.api.activity

import io.ntf.api.activity.model.Activity
import io.ntf.api.infrastructure.SecurityConfiguration
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.ArgumentMatchers
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.eq
import org.mockito.Captor
import org.mockito.Mockito.*
import org.mockito.internal.verification.Times
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf
import org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt
import org.springframework.test.web.reactive.server.WebTestClient
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@WebFluxTest(value = [ActivityResource::class], excludeAutoConfiguration = [])
@Import(SecurityConfiguration::class)
internal class ActivityResourceTest {

  @Autowired
  lateinit var rest: WebTestClient

  @MockBean
  lateinit var activityService: ActivityService

  @Test
  internal fun `should return activity details by id`() {
    val userId = "existing-user-id"
    val activityId = "existing-activity-id"

    `when`(activityService.findByUserIdAndId(userId, activityId))
      .thenReturn(
        Mono.just(
          Activity(
            id = activityId,
            userId = userId,
            name = "task #1",
            start = NOW,
            end = NOW.plusHours(2),
            tags = listOf("a-tag")
          )
        )
      )

    rest.mutateWith(mockJwt().jwt { jwt -> jwt.claim("sub", userId).claim("scope", "read:activities") })
      .get().uri("/activities/$activityId").exchange()
      .expectStatus().is2xxSuccessful
      .expectBody()
      .jsonPath("$.id").isEqualTo(activityId)
      .jsonPath("$.name").isEqualTo("task #1")
      .jsonPath("$.start").isEqualTo(NOW.format(DateTimeFormatter.ISO_DATE_TIME))
      .jsonPath("$.end").isEqualTo(NOW.plusHours(2).format(DateTimeFormatter.ISO_DATE_TIME))
      .jsonPath("$.tags.length()").isEqualTo(1)
      .jsonPath("$.tags[0]").isEqualTo("a-tag")

  }

  //TODO well maybe a bit late but how to mock this?
//  @Test
//  internal fun `should repeat the given activity`() {
//    val userId = "existing-user-id"
//
//    `when`(activityService.create(
//      userId = userId,
//      name = "repeat me",
//      start = LocalDateTime.of(2020, 12, 1, 8, 0),
//      end = LocalDateTime.of(2020, 12, 1, 8, 0),
//      tags = listOf("tag")
//    )).thenReturn(Mono.empty())
//
//    rest.mutateWith(mockJwt().jwt { jwt -> jwt.claim("sub", userId).claim("scope", "start:activity") })
//      .mutateWith(csrf())
//      .post().uri("/activities/repeat")
//      .contentType(MediaType.APPLICATION_JSON)
//      .body(Mono.just("""{"activity": {"name": "repeat me","tags": ["tag"],"start": "08:00","end": "16:00"},"config": {"from": "2020-12-01","to": "2020-12-06","selectedDays": [1,4,2,3,5]}}"""), String::class.java)
//      .exchange()
//      .expectStatus().isCreated
//
//    verify(activityService, Times(6)).create(
//      userId = anyString(),
//      name = anyString(),
//      start = startCaptor.capture(),
//      end = endCaptor.capture(),
//      tags = anyList()
//    )
//  }

  companion object {
    val NOW: LocalDateTime = LocalDateTime.now()
  }
}
