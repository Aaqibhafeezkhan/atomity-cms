package io.atomity.generalcms.post.entity;

import com.fasterxml.jackson.databind.JsonNode;
import io.atomity.generalcms.media.entity.Media;
import io.atomity.generalcms.shared.Timestamps;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * One content item of any type (news, career, docs, kb, ...). Content and metadata change through
 * {@link #edit}; the lifecycle (draft → published → archived) only through the intent methods, so the
 * publishing rules live in one place. The content type is chosen at creation and never changes.
 */
@Entity
@Table(name = "posts")
public class Post {

    @Id
    private UUID id;

    /** Key of a {@code ContentTypeDefinition}, e.g. {@code career}. */
    @Column(name = "content_type", nullable = false, updatable = false)
    private String contentType;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "excerpt", nullable = false)
    private String excerpt;

    /** Tiptap/ProseMirror document, stored as jsonb. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content", nullable = false, columnDefinition = "jsonb")
    private JsonNode content;

    /** Plain text of {@link #content}, kept for search. */
    @Column(name = "content_text", nullable = false)
    private String contentText;

    /** Type-specific values, validated against the content type's definition before they get here. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "fields", nullable = false, columnDefinition = "jsonb")
    private JsonNode fields;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PostStatus status;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    /** Library images embedded in the body, derived from {@link #content} on every edit. */
    @ManyToMany
    @JoinTable(name = "post_images",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "media_id"))
    private Set<Media> inlineImages = new HashSet<>();

    protected Post() {
    }

    /** A new item always starts as a draft. */
    public static Post create(String contentType, PostEdit edit) {
        var post = new Post();
        post.id = UUID.randomUUID();
        post.contentType = contentType;
        post.status = PostStatus.DRAFT;
        post.createdAt = Timestamps.now();
        post.edit(edit);
        return post;
    }

    public void edit(PostEdit edit) {
        this.title = edit.title();
        this.slug = edit.slug();
        this.excerpt = edit.excerpt();
        this.content = edit.content();
        this.contentText = edit.contentText();
        this.fields = edit.fields();
        // Edit the managed collection in place so Hibernate tracks the change.
        this.inlineImages.clear();
        this.inlineImages.addAll(edit.inlineImages());
        touch();
    }

    /**
     * Makes the item live. The first publication date is kept across unpublish/republish,
     * so re-publishing doesn't move an item to the top of feeds.
     */
    public void publish() {
        status = PostStatus.PUBLISHED;
        if (publishedAt == null) {
            publishedAt = Timestamps.now();
        }
        touch();
    }

    /** Back to draft: from published, or restoring an archived item. */
    public void unpublish() {
        status = PostStatus.DRAFT;
        touch();
    }

    public void archive() {
        status = PostStatus.ARCHIVED;
        touch();
    }

    private void touch() {
        updatedAt = Timestamps.now();
    }

    public UUID getId() { return id; }
    public String getContentType() { return contentType; }
    public String getTitle() { return title; }
    public String getSlug() { return slug; }
    public String getExcerpt() { return excerpt; }
    public JsonNode getContent() { return content; }
    public String getContentText() { return contentText; }
    public JsonNode getFields() { return fields; }
    public PostStatus getStatus() { return status; }
    public Instant getPublishedAt() { return publishedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }
    public Set<Media> getInlineImages() { return inlineImages; }
}
