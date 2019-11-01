package io.ntf.api.activity.model

import io.ntf.api.activity.NewLog
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document

@Document(collection = "logs")
data class Log(@Id val id: String? = null, val userId: String, val name: String) {
  companion object {
      fun from(userId: String, newLog: NewLog):Log {
        return Log(userId = userId, name = newLog.name)
      }
  }
}
