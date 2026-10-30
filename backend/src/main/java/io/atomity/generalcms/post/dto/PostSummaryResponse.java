package io.atomity.generalcms.post.dto;

import io.atomity.generalcms.post.entity.Post;
import io.atomity.generalcms.post.entity.PostStatus;

import java.time.Instant;
import java.util.UUID;

/** A row of the admin list: no body, no type-specific fields. */
public record PostSummaryResponse(
        UUID id,
        String type,
        String title,
        String slug,
        String excerpt,
        PostStatus status,
        Instant publishedAt,
        Instant updatedAt) {

    public static PostSummaryResponse of(Post post) {
        return new PostSummaryResponse(post.getId(), post.getContentType(), post.getTitle(), post.getSlug(),
                post.getExcerpt(), post.getStatus(), post.getPublishedAt(), post.getUpdatedAt());
    }
}
