package io.atomity.generalcms.media;

import com.fasterxml.jackson.databind.JsonNode;
import io.atomity.generalcms.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.mock.web.MockMultipartFile;

import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Real HTTP through embedded Tomcat. MockMvc never serialises headers, so it cannot see Tomcat dropping
 * a Content-Disposition that holds non-Latin-1 characters; this does.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MediaWireTest extends IntegrationTest {

    @LocalServerPort
    int port;

    private final HttpClient client = HttpClient.newHttpClient();

    @Test
    void contentDispositionSurvivesTomcatForEveryKindOfFileName() throws Exception {
        byte[] png = TestImages.encode("png", 8, 8);
        for (String name : new String[] {"photo.png", "café.png", "über.png", "封面.png",
                "测试图片.png", "😀.png", "report\"final.png", "a;b%c.png"}) {
            var file = new MockMultipartFile("file", name, "image/png", png);
            JsonNode media = data(call(multipart("/api/v1/media").file(file)).andExpect(status().isCreated()));
            assertThat(media.path("originalFilename").asText()).as("stored name").isEqualTo(name);

            HttpResponse<byte[]> response = client.send(
                    HttpRequest.newBuilder(URI.create("http://localhost:" + port + media.path("url").asText())).build(),
                    HttpResponse.BodyHandlers.ofByteArray());

            assertThat(response.statusCode()).as(name).isEqualTo(200);
            assertThat(response.body()).as(name).isEqualTo(png);
            assertThat(response.headers().firstValue("Content-Type")).contains("image/png");
            String header = response.headers().firstValue("Content-Disposition").orElse(null);
            assertThat(header).as("Content-Disposition for " + name).isNotNull().startsWith("inline;");
            assertThat(header.chars().allMatch(c -> c >= 0x20 && c <= 0x7E)).as("ASCII only: " + name).isTrue();
            // A client that understands filename* ends up with the exact original name.
            int star = header.indexOf("filename*=UTF-8''");
            String real = star < 0 ? name
                    : URLDecoder.decode(header.substring(star + "filename*=UTF-8''".length()), StandardCharsets.UTF_8);
            assertThat(real).as(name).isEqualTo(name);
        }
    }
}
