package io.atomity.generalcms.media.storage;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** {@code generalcms.media.storage.*}: where uploaded images are written on disk. */
@Validated
@ConfigurationProperties(prefix = "generalcms.media.storage")
public record StorageProperties(@NotBlank String localDirectory) {
}
