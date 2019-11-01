package io.ntf.api.infrastructure

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration


@Configuration
class JacksonConfiguration {

  @Bean
  fun kotlinModule() = KotlinModule()

  @Bean
  fun javaTimeModule() = JavaTimeModule()
}
