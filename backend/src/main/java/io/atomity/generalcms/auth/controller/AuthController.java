package io.atomity.generalcms.auth.controller;

import io.atomity.generalcms.auth.dto.LoginRequest;
import io.atomity.generalcms.auth.dto.LoginResponse;
import io.atomity.generalcms.auth.service.AuthService;
import io.atomity.generalcms.shared.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        return ApiResponse.ok(authService.login(request.email(), request.password(), clientKey(http)));
    }

    /**
     * Who is signing in, for rate limiting. The backend is only reachable through the
     * frontend's route handlers, which set X-Forwarded-For to the browser's address;
     * without it, the direct peer address is used.
     */
    private static String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].strip();
        }
        return request.getRemoteAddr();
    }
}
