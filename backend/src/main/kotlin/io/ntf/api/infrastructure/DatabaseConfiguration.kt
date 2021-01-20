package io.ntf.api.infrastructure

import com.mongodb.Block
import com.mongodb.MongoClientSettings
import org.springframework.boot.autoconfigure.mongo.MongoClientSettingsBuilderCustomizer
import org.springframework.context.annotation.Configuration
import org.springframework.data.mongodb.config.EnableMongoAuditing
import java.util.concurrent.TimeUnit

@Configuration
@EnableMongoAuditing
class DatabaseConfiguration : MongoClientSettingsBuilderCustomizer {

  override fun customize(clientSettingsBuilder: MongoClientSettings.Builder) {
    clientSettingsBuilder.applyToServerSettings { t ->
      t.minHeartbeatFrequency(5000, TimeUnit.MILLISECONDS)
        .heartbeatFrequency(30000, TimeUnit.MILLISECONDS)
    }
  }
}
