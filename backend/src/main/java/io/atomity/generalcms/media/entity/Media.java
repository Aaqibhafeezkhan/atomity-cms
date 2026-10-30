package io.atomity.generalcms.media.entity;

import io.atomity.generalcms.shared.Timestamps;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/** An uploaded image. The file lives in storage under {@code storageKey}; this row is its metadata. */
@Entity
@Table(name = "media")
public class Media {

    @Id
    private UUID id;

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "width", nullable = false)
    private int width;

    @Column(name = "height", nullable = false)
    private int height;

    @Column(name = "alt_text", nullable = false)
    private String altText;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Media() {
    }

    public static Media create(UUID id, String storageKey, String originalFilename, String contentType,
                               long sizeBytes, int width, int height) {
        var media = new Media();
        media.id = id;
        media.storageKey = storageKey;
        media.originalFilename = originalFilename;
        media.contentType = contentType;
        media.sizeBytes = sizeBytes;
        media.width = width;
        media.height = height;
        media.altText = "";
        media.createdAt = Timestamps.now();
        return media;
    }

    public void changeAltText(String altText) {
        this.altText = altText == null ? "" : altText.strip();
    }

    public UUID getId() { return id; }
    public String getStorageKey() { return storageKey; }
    public String getOriginalFilename() { return originalFilename; }
    public String getContentType() { return contentType; }
    public long getSizeBytes() { return sizeBytes; }
    public int getWidth() { return width; }
    public int getHeight() { return height; }
    public String getAltText() { return altText; }
    public Instant getCreatedAt() { return createdAt; }
}
