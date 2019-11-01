package io.ntf.api.infrastructure.jwt;

import io.ntf.api.infrastructure.jwt.authentication.PreAuthenticatedAuthenticationJsonWebToken;
import org.slf4j.Logger;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * @author Sebastien Astie
 */
public class TokenUtils {
  public static String tokenFromHeader(final String authorizationHeader) {
    if (authorizationHeader == null || !authorizationHeader.toLowerCase().startsWith("bearer")) {
      return null;
    }

    String[] parts = authorizationHeader.split(" ");

    if (parts.length < 2) {
      return null;
    }

    return parts[1].trim();
  }


  public static SecurityContext createSecurityContext(String token, Logger logger){
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    Authentication authentication = PreAuthenticatedAuthenticationJsonWebToken.usingToken(token);
    if (authentication != null) {
      context.setAuthentication(authentication);
      logger.debug("Found bearer token in request. Saving it in SecurityContext");
    }
    return context;
  }
}
