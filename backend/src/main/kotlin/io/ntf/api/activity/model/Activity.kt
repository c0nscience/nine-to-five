package io.ntf.api.activity.model

import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Duration
import java.time.LocalDateTime

@Document(collection = "activities")
data class Activity(@Id val id: String? = null,
                    val userId: String,
                    val name: String,
                    val start: LocalDateTime,
                    val end: LocalDateTime? = null,
                    @CreatedDate val createdDate: LocalDateTime? = null,
                    @LastModifiedDate val lastModifiedDate: LocalDateTime? = null) {

  fun duration(): Duration {
    return Duration.between(this.start, this.end ?: LocalDateTime.now())
  }

}
