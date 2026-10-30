package io.atomity.generalcms.auth.dto;

import java.time.Instant;

/** The bearer token for subsequent requests and when it stops working. */
public record LoginResponse(String token, Instant expiresAt) {
}
