package io.atomity.generalcms.shared;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.Map;

/**
 * Envelope for every JSON response: {@code {"data": ...}} on success,
 * {@code {"errors": [...]}} on failure. {@code meta} carries list metadata
 * such as pagination.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(T data, Map<String, Object> meta, List<ApiError> errors) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(data, null, null);
    }

    public static <T> ApiResponse<T> ok(T data, Map<String, Object> meta) {
        return new ApiResponse<>(data, meta, null);
    }

    public static <T> ApiResponse<T> error(List<ApiError> errors) {
        return new ApiResponse<>(null, null, errors);
    }

    public static <T> ApiResponse<T> error(ApiError error) {
        return new ApiResponse<>(null, null, List.of(error));
    }
}
