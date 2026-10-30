package io.atomity.generalcms.shared;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(String errorCode, String message, String correlationId) {

    public static ApiError of(String errorCode, String message) {
        return new ApiError(errorCode, message, null);
    }
}
