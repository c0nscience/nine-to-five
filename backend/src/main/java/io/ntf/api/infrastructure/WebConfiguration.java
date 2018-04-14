package io.ntf.api.infrastructure;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

@Configuration
public class WebConfiguration implements WebFluxConfigurer {

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
      .allowedOrigins("http://localhost:3000", "https://ntf-webapp.herokuapp.com")
      .allowedMethods("GET", "POST", "PUT", "DELETE");
  }
}
