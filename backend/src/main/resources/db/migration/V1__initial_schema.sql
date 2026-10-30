-- Initial schema: the media library and the content items (table `posts`).
-- All ids are UUIDs assigned by the application; all timestamps are UTC TIMESTAMPTZ.

-- Trigram indexes make the list's substring search (ILIKE '%term%') index-backed.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE media (
    id                UUID         PRIMARY KEY,
    storage_key       VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type      VARCHAR(50)  NOT NULL,
    size_bytes        BIGINT       NOT NULL,
    width             INTEGER      NOT NULL,
    height            INTEGER      NOT NULL,
    alt_text          VARCHAR(300) NOT NULL DEFAULT '',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_media_storage_key UNIQUE (storage_key)
);

CREATE INDEX idx_media_created_at ON media (created_at DESC);

-- One table for every content type (news, career, docs, kb, ...). The shared columns are the
-- same for all of them; whatever a type adds on top lives in `fields` and is validated in
-- Java by the content-type registry, so a new type needs no migration.
CREATE TABLE posts (
    id            UUID          PRIMARY KEY,
    content_type  VARCHAR(30)   NOT NULL,
    title         VARCHAR(200)  NOT NULL DEFAULT '',
    slug          VARCHAR(160)  NOT NULL,
    excerpt       VARCHAR(300)  NOT NULL DEFAULT '',
    -- Tiptap/ProseMirror document. content_text is its plain text, derived on save, used for search.
    content       JSONB         NOT NULL,
    content_text  TEXT          NOT NULL DEFAULT '',
    -- Type-specific values, e.g. {"department": "Engineering"} for a career opening.
    fields        JSONB         NOT NULL DEFAULT '{}'::jsonb,
    status        VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    -- Set the first time the item is published; kept across unpublish/republish.
    published_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    -- Optimistic-locking counter (JPA @Version).
    version       BIGINT        NOT NULL DEFAULT 0,
    -- Slugs only have to be unique within a type: /news/launch and /docs/launch can coexist.
    CONSTRAINT uq_posts_type_slug UNIQUE (content_type, slug),
    CONSTRAINT ck_posts_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT ck_posts_fields_object CHECK (jsonb_typeof(fields) = 'object')
);

-- Admin list and public list: filter by type and status, newest first.
CREATE INDEX idx_posts_type_status_updated_at ON posts (content_type, status, updated_at DESC);
CREATE INDEX idx_posts_type_status_published_at ON posts (content_type, status, published_at DESC);
CREATE INDEX idx_posts_title_trgm ON posts USING gin (title gin_trgm_ops);
CREATE INDEX idx_posts_excerpt_trgm ON posts USING gin (excerpt gin_trgm_ops);
CREATE INDEX idx_posts_content_text_trgm ON posts USING gin (content_text gin_trgm_ops);

-- Images embedded in an item's body (derived from the content JSON on save), so a
-- library image can't be deleted while an item still shows it.
CREATE TABLE post_images (
    post_id  UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media (id) ON DELETE RESTRICT,
    PRIMARY KEY (post_id, media_id)
);

CREATE INDEX idx_post_images_media_id ON post_images (media_id);
