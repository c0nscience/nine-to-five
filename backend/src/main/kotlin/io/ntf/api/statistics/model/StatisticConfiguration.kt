package io.ntf.api.statistics.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.temporal.ChronoUnit

@Document(collection = "statisticConfigurations")
data class StatisticConfiguration(@Id val id: String? = null,
                                  val userId: String,
                                  val name: String,
                                  val tags: List<String>,
                                  val hours: Double,
                                  val timeUnit: ChronoUnit
)
