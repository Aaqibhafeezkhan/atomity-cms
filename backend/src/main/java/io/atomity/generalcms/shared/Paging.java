package io.atomity.generalcms.shared;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Map;

/** Turns the {@code sort/direction/page/size} query parameters of a list endpoint into a {@link Pageable}. */
public final class Paging {

    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 100;

    private Paging() {
    }

    /**
     * @param sortable API sort key to entity attribute; any other key is rejected rather than passed to the database
     * @param defaultKey the sort key used when none is given
     */
    public static Pageable of(String sort, String direction, Integer page, Integer size,
                              Map<String, String> sortable, String defaultKey) {
        String attribute = sortable.get(sort == null ? defaultKey : sort);
        if (attribute == null) {
            throw ApiException.badRequest("BAD_REQUEST", "sort must be one of " + String.join(", ", sortable.keySet()));
        }
        Sort.Direction dir;
        if (direction == null) {
            dir = Sort.Direction.DESC;
        } else if (direction.equalsIgnoreCase("asc") || direction.equalsIgnoreCase("desc")) {
            dir = Sort.Direction.fromString(direction);
        } else {
            throw ApiException.badRequest("BAD_REQUEST", "direction must be asc or desc");
        }
        int pageNumber = page == null ? 0 : Math.max(0, page);
        int pageSize = size == null ? DEFAULT_SIZE : Math.min(MAX_SIZE, Math.max(1, size));
        if ((long) pageNumber * pageSize > Integer.MAX_VALUE) {
            throw ApiException.badRequest("BAD_REQUEST", "page is out of range");
        }
        // id breaks ties so pages never overlap.
        return PageRequest.of(pageNumber, pageSize, Sort.by(new Sort.Order(dir, attribute), Sort.Order.asc("id")));
    }
}
