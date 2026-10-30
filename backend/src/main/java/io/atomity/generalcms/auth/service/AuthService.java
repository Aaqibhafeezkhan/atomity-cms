package io.atomity.generalcms.auth.service;

import io.atomity.generalcms.auth.config.AuthProperties;
import io.atomity.generalcms.auth.config.SecurityConfig;
import io.atomity.generalcms.auth.dto.LoginResponse;
import io.atomity.generalcms.shared.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    /** Token subject. There is one admin, so the token needs no user identity (and carries no PII). */
    static final String SUBJECT = "admin";

    private final AuthProperties properties;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final LoginRateLimiter rateLimiter;

    public AuthService(AuthProperties properties, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder,
                       LoginRateLimiter rateLimiter) {
        this.properties = properties;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.rateLimiter = rateLimiter;
    }

    public LoginResponse login(String email, String password, String client) {
        Duration wait = rateLimiter.retryAfter(client);
        if (!wait.isZero() && !wait.isNegative()) {
            long minutes = Math.max(1, (wait.toSeconds() + 59) / 60);
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "TOO_MANY_ATTEMPTS",
                    "Too many failed sign-in attempts. Try again in %d minute%s.".formatted(minutes, minutes == 1 ? "" : "s"));
        }

        // Both checks always run, so response time doesn't reveal which one failed.
        boolean emailMatches = constantTimeEquals(
                email.strip().toLowerCase(Locale.ROOT), properties.admin().email().strip().toLowerCase(Locale.ROOT));
        boolean passwordMatches = passwordEncoder.matches(password, properties.admin().passwordHash());
        if (!emailMatches || !passwordMatches) {
            rateLimiter.recordFailure(client);
            log.warn("Failed admin sign-in attempt");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Wrong email or password");
        }
        rateLimiter.recordSuccess(client);

        Instant now = Instant.now();
        Instant expiresAt = now.plus(properties.jwt().ttl());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(SecurityConfig.ISSUER)
                .subject(SUBJECT)
                .issuedAt(now)
                .expiresAt(expiresAt)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        log.info("Admin signed in");
        return new LoginResponse(token, expiresAt);
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
