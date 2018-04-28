package io.ntf.api.infrastructure;

import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.module.kotlin.KotlinModule;
import io.vavr.jackson.datatype.VavrModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfiguration {

  @Bean
  public Module vavrModule() {
    return new VavrModule();
  }

  @Bean
  public Module kotlinModule() {
    return new KotlinModule();
  }

}
