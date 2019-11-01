package io.ntf.api.infrastructure;

import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.module.kotlin.KotlinModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfiguration {

  @Bean
  public Module kotlinModule() {
    return new KotlinModule();
  }

  @Bean
  public Module javaTimeModule() {
    return new JavaTimeModule();
  }
}
