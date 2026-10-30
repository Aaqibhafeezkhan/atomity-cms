package io.atomity.generalcms.content.dto;

import io.atomity.generalcms.shared.NulCharacters;
import io.atomity.generalcms.shared.Paging;
import jakarta.validation.constraints.Pattern;
import org.springframework.data.domain.Pageable;

import java.util.Map;

/** Query parameters of GET /api/v1/content/{type}. Only published items are ever listed. */
public record ContentListQuery(
        @Pattern(regexp = NulCharacters.NONE, message = NulCharacters.MESSAGE) String q,
        String sort,
        String direction,
        Integer page,
        Integer size) {

    private static final Map<String, String> SORTABLE = Map.of(
            "publishedAt", "publishedAt",
            "updatedAt", "updatedAt",
            "title", "title");

    public Pageable toPageable() {
        return Paging.of(sort, direction, page, size, SORTABLE, "publishedAt");
    }
}
