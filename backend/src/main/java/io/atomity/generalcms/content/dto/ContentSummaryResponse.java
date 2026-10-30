package io.atomity.generalcms.content.dto;

import com.fasterxml.jackson.databind.JsonNode;
import io.atomity.generalcms.post.entity.Post;

import java.time.Instant;
import java.util.UUID;

/** A published item in a public list: everything but the body. The type-specific fields are included so a list can be rendered from one request. */
public record ContentSummaryResponse(
        UUID id,
        String type,
        String title,
        String slug,
        String excerpt,
        JsonNode fields,
        Instant publishedAt,
        Instant updatedAt) {

    public static ContentSummaryResponse of(Post post) {
        return new ContentSummaryResponse(post.getId(), post.getContentType(), post.getTitle(), post.getSlug(),
                post.getExcerpt(), post.getFields(), post.getPublishedAt(), post.getUpdatedAt());
    }
}
