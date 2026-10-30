package io.atomity.generalcms.auth.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * {@code generalcms.admin.*} and {@code generalcms.jwt.*}. There is a single admin account,
 * configured entirely through the environment — no users table, no roles. The app
 * refuses to start if any of these are missing.
 */
@Validated
@ConfigurationProperties(prefix = "generalcms")
public record AuthProperties(@Valid @NotNull Admin admin, @Valid @NotNull Jwt jwt) {

    /** @param passwordHash bcrypt hash of the admin password — the plain password is never configured. */
    public record Admin(@NotBlank String email, @NotBlank String passwordHash) {
    }

    /** @param secret HMAC key for HS256; at least 32 bytes. */
    public record Jwt(
            @NotBlank @Size(min = 32, message = "must be at least 32 characters") String secret,
            @NotNull Duration ttl) {
    }
}
