package io.atomity.generalcms.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "is required") @Size(max = 255, message = "is too long") String email,
        @NotBlank(message = "is required") @Size(max = 255, message = "is too long") String password) {
}
