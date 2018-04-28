package io.ntf.api.activity.model

import io.vavr.control.Option
import lombok.Builder
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Duration
import java.time.LocalDateTime

@Document(collection = "activities")
@Builder
data class Activity(@Id val id: String? = null, val userId: String, val logId: String? = null, val name: String, val start: LocalDateTime, val end: LocalDateTime? = null) {

    fun duration(): Duration {
        return Duration.between(this.start, Option.of<LocalDateTime>(this.end).getOrElse(LocalDateTime.now()))
    }

}
