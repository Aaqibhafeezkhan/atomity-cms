package io.atomity.generalcms.media;

import com.fasterxml.jackson.databind.JsonNode;
import io.atomity.generalcms.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MediaApiTest extends IntegrationTest {

    private JsonNode upload(String filename, String declaredType, byte[] bytes) throws Exception {
        var file = new MockMultipartFile("file", filename, declaredType, bytes);
        return data(call(multipart("/api/v1/media").file(file)).andExpect(status().isCreated()));
    }

    @Test
    void uploadRecordsMetadataAndServesTheFilePublicly() throws Exception {
        byte[] png = TestImages.encode("png", 300, 200);
        JsonNode media = upload("../../etc/cover.png", "image/png", png);

        assertThat(media.path("originalFilename").asText()).isEqualTo("cover.png");
        assertThat(media.path("contentType").asText()).isEqualTo("image/png");
        assertThat(media.path("width").asInt()).isEqualTo(300);
        assertThat(media.path("height").asInt()).isEqualTo(200);
        assertThat(media.path("usageCount").asInt()).isZero();

        // No token: image files are public so published pages can embed them.
        mockMvc.perform(get(media.path("url").asText()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(content().bytes(png));

        // HEAD is public too and returns headers without a body.
        mockMvc.perform(head(media.path("url").asText()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(content().string(""));

        call(get("/api/v1/media")).andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void typeComesFromTheBytesNotTheClaim() throws Exception {
        // A JPEG uploaded as "photo.png" is stored and served as a JPEG.
        JsonNode media = upload("photo.png", "image/png", TestImages.encode("jpg", 64, 48));
        assertThat(media.path("contentType").asText()).isEqualTo("image/jpeg");

        var text = new MockMultipartFile("file", "evil.png", "image/png", "not an image".getBytes());
        call(multipart("/api/v1/media").file(text))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.errors[0].errorCode").value("UNSUPPORTED_TYPE"));
    }

    @Test
    void unsupportedContentTypeOnMediaPatchReturns415() throws Exception {
        call(patch("/api/v1/media/00000000-0000-0000-0000-000000000001")
                        .contentType(MediaType.TEXT_PLAIN).content("not json"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.errors[0].errorCode").value("UNSUPPORTED_MEDIA_TYPE"))
                .andExpect(jsonPath("$.errors[0].message").isNotEmpty());
    }

    @Test
    void malformedJsonOnMediaPatchRemains400() throws Exception {
        call(patch("/api/v1/media/00000000-0000-0000-0000-000000000001")
                        .contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].errorCode").value("MALFORMED_REQUEST"));
    }

    @Test
    void altTextCanBeEdited() throws Exception {
        String id = upload("a.gif", "image/gif", TestImages.encode("gif", 10, 10)).path("id").asText();
        call(patch("/api/v1/media/" + id), Map.of("altText", "  A tiny square  "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.altText").value("A tiny square"));
    }

    @Test
    void altTextRejectsNulCharacters() throws Exception {
        String id = upload("a.gif", "image/gif", TestImages.encode("gif", 10, 10)).path("id").asText();
        call(patch("/api/v1/media/" + id), Map.of("altText", "A tiny\u0000square"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].errorCode").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors[0].message").value("altText must not contain NUL characters"));
    }

    @Test
    void imageInUseCannotBeDeleted() throws Exception {
        JsonNode media = upload("inline.png", "image/png", TestImages.encode("png", 20, 20));
        String id = media.path("id").asText();

        Map<String, Object> image = Map.of("type", "image",
                "attrs", Map.of("src", media.path("url").asText(), "mediaId", id));
        Map<String, Object> body = new HashMap<>();
        body.put("type", "news");
        body.put("title", "Has an image");
        body.put("content", Map.of("type", "doc", "content", List.of(image)));
        String postId = data(call(post("/api/v1/posts"), body).andExpect(status().isCreated())).path("id").asText();

        call(get("/api/v1/media")).andExpect(jsonPath("$.data[0].usageCount").value(1));
        call(delete("/api/v1/media/" + id))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0].errorCode").value("MEDIA_IN_USE"));

        // An image-only post counts as having content, so it can be published.
        call(post("/api/v1/posts/" + postId + "/publish")).andExpect(status().isOk());

        // Archiving doesn't remove the image from the body, so it stays in use.
        call(post("/api/v1/posts/" + postId + "/archive")).andExpect(status().isOk());
        call(delete("/api/v1/media/" + id)).andExpect(status().isConflict());
    }

    @Test
    void unusedImageCanBeDeleted() throws Exception {
        JsonNode media = upload("spare.png", "image/png", TestImages.encode("png", 20, 20));
        call(delete("/api/v1/media/" + media.path("id").asText())).andExpect(status().isNoContent());
        mockMvc.perform(get(media.path("url").asText())).andExpect(status().isNotFound());
    }
}
