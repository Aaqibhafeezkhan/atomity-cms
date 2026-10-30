package io.atomity.generalcms.shared;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public final class Timestamps {

    private Timestamps() {
    }

    /**
     * The current instant at the database's precision (Postgres stores microseconds), so a
     * value returned right after a write is identical to the one read back later.
     */
    public static Instant now() {
        return Instant.now().truncatedTo(ChronoUnit.MICROS);
    }
}
