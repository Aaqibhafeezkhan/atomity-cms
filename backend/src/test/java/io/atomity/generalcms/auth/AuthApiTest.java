package io.atomity.generalcms.auth;

import io.atomity.generalcms.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthApiTest extends IntegrationTest {

    @Test
    void loginWithAdminCredentialsReturnsToken() throws Exception {
        mockMvc.perform(login("ADMIN@test.local", ADMIN_PASSWORD, "client-ok"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.expiresAt").isNotEmpty());
    }

    @Test
    void wrongPasswordIsRejectedWithoutSayingWhichFieldWasWrong() throws Exception {
        mockMvc.perform(login(ADMIN_EMAIL, "nope", "client-wrong"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errors[0].errorCode").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.errors[0].message").value("Wrong email or password"));
    }

    @Test
    void repeatedFailuresAreRateLimitedPerClient() throws Exception {
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(login(ADMIN_EMAIL, "nope", "client-brute")).andExpect(status().isUnauthorized());
        }
        // Even the right password is refused while the client is locked out...
        mockMvc.perform(login(ADMIN_EMAIL, ADMIN_PASSWORD, "client-brute"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.errors[0].errorCode").value("TOO_MANY_ATTEMPTS"));
        // ...but other clients are unaffected.
        mockMvc.perform(login(ADMIN_EMAIL, ADMIN_PASSWORD, "client-other")).andExpect(status().isOk());
    }

    @Test
    void apiRequiresToken() throws Exception {
        mockMvc.perform(get("/api/v1/posts"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errors[0].errorCode").value("UNAUTHORIZED"));
    }

    @Test
    void forgedTokenIsRejected() throws Exception {
        String forged = token().substring(0, token().lastIndexOf('.') + 1) + "invalidsignature";
        mockMvc.perform(get("/api/v1/posts").header("Authorization", "Bearer " + forged))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validTokenIsAccepted() throws Exception {
        call(get("/api/v1/posts")).andExpect(status().isOk());
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder login(
            String email, String password, String client) throws Exception {
        return post("/api/v1/auth/login")
                .header("X-Forwarded-For", client)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", email, "password", password)));
    }
}
