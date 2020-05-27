package io.ntf.api.activity

import io.ntf.api.activity.model.Activity
import io.ntf.api.infrastructure.SecurityConfiguration
import org.junit.jupiter.api.Test
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
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
      .thenReturn(Mono.just(Activity(
        id = activityId,
        userId = userId,
        name = "task #1",
        start = NOW,
        end = NOW.plusHours(2),
        tags = listOf("a-tag")
      )))

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

  companion object {
    val NOW: LocalDateTime = LocalDateTime.now()
  }
}
