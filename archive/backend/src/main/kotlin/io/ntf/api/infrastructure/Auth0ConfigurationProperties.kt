package io.ntf.api.infrastructure

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding
import org.springframework.context.annotation.Configuration

@ConstructorBinding
@ConfigurationProperties("auth0")
data class Auth0ConfigurationProperties(val issuer: String,
                                        val audience: String)
