package io.atomity.generalcms.post.dto;

import com.fasterxml.jackson.databind.JsonNode;
import io.atomity.generalcms.post.entity.Post;
import io.atomity.generalcms.post.entity.PostStatus;

import java.time.Instant;
import java.util.UUID;

/** A content item as the admin UI loads it for editing. */
public record PostResponse(
        UUID id,
        String type,
        String title,
        String slug,
        String excerpt,
        JsonNode content,
        JsonNode fields,
        PostStatus status,
        long version,
        Instant publishedAt,
        Instant createdAt,
        Instant updatedAt) {

    public static PostResponse of(Post post) {
        return new PostResponse(post.getId(), post.getContentType(), post.getTitle(), post.getSlug(), post.getExcerpt(),
                post.getContent(), post.getFields(), post.getStatus(), post.getVersion(), post.getPublishedAt(),
                post.getCreatedAt(), post.getUpdatedAt());
    }
}
