package io.atomity.generalcms.content;

import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

/** The kinds of value a type-specific field can hold. The lowercase name is what the API and the admin UI use. */
public enum FieldType {
    TEXT,
    URL,
    DATE,
    BOOLEAN,
    NUMBER,
    SELECT;

    @JsonValue
    public String key() {
        return name().toLowerCase(Locale.ROOT);
    }
}
