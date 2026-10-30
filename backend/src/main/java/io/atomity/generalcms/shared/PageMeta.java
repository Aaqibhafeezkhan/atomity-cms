package io.atomity.generalcms.shared;

import org.springframework.data.domain.Page;

import java.util.LinkedHashMap;
import java.util.Map;

/** Pagination block returned in {@code meta} by every paginated list endpoint. */
public final class PageMeta {

    private PageMeta() {
    }

    public static Map<String, Object> of(Page<?> page) {
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("page", page.getNumber());
        meta.put("size", page.getSize());
        meta.put("totalElements", page.getTotalElements());
        meta.put("totalPages", Math.max(1, page.getTotalPages()));
        return meta;
    }
}
