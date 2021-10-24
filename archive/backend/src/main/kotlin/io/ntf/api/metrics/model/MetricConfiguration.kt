package io.ntf.api.metrics.model

import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Duration
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit
import java.util.concurrent.TimeUnit
import kotlin.time.ExperimentalTime
import kotlin.time.toDuration
import kotlin.time.toJavaDuration

@Document(collection = "metricConfigurations")
data class MetricConfiguration(@Id val id: String? = null,
                               val userId: String,
                               val name: String,
                               val tags: List<String> = emptyList(),
                               val timeUnit: ChronoUnit,
                               val formula: String,
                               val threshold: Double = 0.0,
                               @CreatedDate val createdDate: LocalDateTime? = null,
                               @LastModifiedDate val lastModifiedDate: LocalDateTime? = null) {

  @ExperimentalTime
  fun thresholdAsDuration(): Duration {
    return threshold.toDuration(TimeUnit.HOURS).toJavaDuration()
  }
  
  companion object
}
