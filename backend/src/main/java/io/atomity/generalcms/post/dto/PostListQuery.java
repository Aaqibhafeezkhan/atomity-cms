package io.atomity.generalcms.post.dto;

import io.atomity.generalcms.post.entity.PostStatus;
import io.atomity.generalcms.shared.NulCharacters;
import io.atomity.generalcms.shared.Paging;
import jakarta.validation.constraints.Pattern;
import org.springframework.data.domain.Pageable;

import java.util.Map;

/** Query parameters of GET /api/v1/posts. */
public record PostListQuery(
        String type,
        PostStatus status,
        @Pattern(regexp = NulCharacters.NONE, message = NulCharacters.MESSAGE) String q,
        String sort,
        String direction,
        Integer page,
        Integer size) {

    private static final Map<String, String> SORTABLE = Map.of(
            "updatedAt", "updatedAt",
            "title", "title",
            "publishedAt", "publishedAt");

    public Pageable toPageable() {
        return Paging.of(sort, direction, page, size, SORTABLE, "updatedAt");
    }
}
