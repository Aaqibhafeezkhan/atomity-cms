package io.atomity.generalcms.auth.service;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRateLimiterTest {

    /** A clock the test can move forward. */
    private static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-01-01T00:00:00Z");

        void advance(Duration duration) { now = now.plus(duration); }
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }

    @Test
    void locksOutAfterTooManyFailuresThenRecovers() {
        var clock = new MutableClock();
        var limiter = new LoginRateLimiter(clock);
        for (int i = 0; i < LoginRateLimiter.MAX_FAILURES; i++) {
            assertThat(limiter.retryAfter("ip")).isZero();
            limiter.recordFailure("ip");
        }
        assertThat(limiter.retryAfter("ip")).isEqualTo(LoginRateLimiter.WINDOW);
        assertThat(limiter.retryAfter("other-ip")).isZero();

        clock.advance(LoginRateLimiter.WINDOW.plusSeconds(1));
        assertThat(limiter.retryAfter("ip")).isZero();
    }

    @Test
    void successClearsFailures() {
        var limiter = new LoginRateLimiter(new MutableClock());
        for (int i = 0; i < LoginRateLimiter.MAX_FAILURES - 1; i++) {
            limiter.recordFailure("ip");
        }
        limiter.recordSuccess("ip");
        limiter.recordFailure("ip");
        assertThat(limiter.retryAfter("ip")).isZero();
    }
}
