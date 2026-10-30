package io.atomity.generalcms.auth.service;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Slows down password guessing: after {@value #MAX_FAILURES} failed logins from one
 * client within {@link #WINDOW}, further attempts from it are refused until the oldest
 * failure ages out. In memory, so it resets on restart — a speed bump, not a lockout.
 */
@Component
public class LoginRateLimiter {

    static final int MAX_FAILURES = 5;
    static final Duration WINDOW = Duration.ofMinutes(15);
    /** Bounds memory if many distinct clients fail; the oldest entries are dropped. */
    private static final int MAX_TRACKED_CLIENTS = 10_000;

    private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();
    private final Clock clock;

    public LoginRateLimiter() {
        this(Clock.systemUTC());
    }

    LoginRateLimiter(Clock clock) {
        this.clock = clock;
    }

    /** Time until the client may try again, or {@link Duration#ZERO} if it may try now. */
    public Duration retryAfter(String client) {
        Deque<Instant> attempts = failures.get(client);
        if (attempts == null) {
            return Duration.ZERO;
        }
        synchronized (attempts) {
            prune(attempts);
            if (attempts.size() < MAX_FAILURES) {
                return Duration.ZERO;
            }
            return Duration.between(clock.instant(), attempts.peekFirst().plus(WINDOW));
        }
    }

    public void recordFailure(String client) {
        if (failures.size() >= MAX_TRACKED_CLIENTS) {
            failures.clear();
        }
        Deque<Instant> attempts = failures.computeIfAbsent(client, key -> new ArrayDeque<>());
        synchronized (attempts) {
            prune(attempts);
            attempts.addLast(clock.instant());
        }
    }

    public void recordSuccess(String client) {
        failures.remove(client);
    }

    private void prune(Deque<Instant> attempts) {
        Instant cutoff = clock.instant().minus(WINDOW);
        while (!attempts.isEmpty() && attempts.peekFirst().isBefore(cutoff)) {
            attempts.pollFirst();
        }
    }
}
