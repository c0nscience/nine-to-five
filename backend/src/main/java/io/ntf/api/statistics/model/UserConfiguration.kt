package io.ntf.api.statistics.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document

@Document(collection = "userConfigurations")
data class UserConfiguration(@Id val id: String? = null,
                             val userId: String,
                             val workTimeConfiguration: WorkTimeConfiguration)
