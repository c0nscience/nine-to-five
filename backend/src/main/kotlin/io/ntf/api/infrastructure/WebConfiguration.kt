package io.ntf.api.infrastructure

import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.config.CorsRegistry
import org.springframework.web.reactive.config.WebFluxConfigurer

@Configuration
class WebConfiguration : WebFluxConfigurer {

  override fun addCorsMappings(registry: CorsRegistry) {
    registry.addMapping("/**")
      .allowedOrigins("http://localhost:3000", "https://ninetofive.tech")
      .allowedMethods("GET", "POST", "PUT", "DELETE", "HEAD")
  }

}
