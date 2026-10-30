package io.atomity.generalcms.post.dto;

import com.fasterxml.jackson.databind.JsonNode;
import io.atomity.generalcms.shared.NulCharacters;
import io.atomity.generalcms.shared.Slugs;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Create/update body. Text fields may be omitted (treated as empty); an empty slug is derived from
 * the title. {@code type} is required on create and cannot change afterwards. {@code fields} holds
 * the type-specific values (see {@code GET /api/v1/content-types}). {@code version} is required on
 * update: it is the version the editor loaded, and a mismatch means someone else saved in between.
 */
public record PostRequest(
        @Size(max = 30, message = "must be at most 30 characters")
        String type,

        @Size(max = 200, message = "must be at most 200 characters")
        @Pattern(regexp = NulCharacters.NONE, message = NulCharacters.MESSAGE)
        String title,

        @Size(max = 160, message = "must be at most 160 characters")
        @Pattern(regexp = "^$|" + Slugs.PATTERN, message = Slugs.MESSAGE)
        String slug,

        @Size(max = 300, message = "must be at most 300 characters")
        @Pattern(regexp = NulCharacters.NONE, message = NulCharacters.MESSAGE)
        String excerpt,

        @NotNull(message = "is required")
        JsonNode content,

        JsonNode fields,

        Long version) {
}
