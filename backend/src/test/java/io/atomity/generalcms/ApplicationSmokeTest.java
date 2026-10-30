package io.atomity.generalcms;

import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Cross-cutting plumbing every feature relies on: health, error envelope, correlation IDs. */
class ApplicationSmokeTest extends IntegrationTest {

    @Test
    void readinessIsPublicAndReportsUp() throws Exception {
        mockMvc.perform(get("/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void unknownPathReturns404InErrorEnvelope() throws Exception {
        call(get("/api/v1/does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errors[0].errorCode").value("NOT_FOUND"))
                .andExpect(jsonPath("$.errors[0].correlationId").isNotEmpty());
    }

    @Test
    void echoesSafeCorrelationId() throws Exception {
        mockMvc.perform(get("/health/liveness").header("X-Correlation-ID", "abc-123"))
                .andExpect(header().string("X-Correlation-ID", "abc-123"));
    }

    @Test
    void replacesUnsafeCorrelationId() throws Exception {
        mockMvc.perform(get("/health/liveness").header("X-Correlation-ID", "bad\nid"))
                .andExpect(header().string("X-Correlation-ID", matchesPattern("[0-9a-f-]{36}")));
    }
}
