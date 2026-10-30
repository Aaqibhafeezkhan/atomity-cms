package io.atomity.generalcms.content.dto;

import com.fasterxml.jackson.databind.JsonNode;
import io.atomity.generalcms.post.entity.Post;

import java.time.Instant;
import java.util.UUID;

/**
 * One published item with its body (a Tiptap/ProseMirror JSON document). Editor-only data such as
 * the status and the version is deliberately left out.
 */
public record ContentResponse(
        UUID id,
        String type,
        String title,
        String slug,
        String excerpt,
        JsonNode fields,
        JsonNode content,
        Instant publishedAt,
        Instant updatedAt) {

    public static ContentResponse of(Post post) {
        return new ContentResponse(post.getId(), post.getContentType(), post.getTitle(), post.getSlug(),
                post.getExcerpt(), post.getFields(), post.getContent(), post.getPublishedAt(), post.getUpdatedAt());
    }
}
