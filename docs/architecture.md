# Architecture

```
Browser ──► frontend (Next.js) ──► backend (Spring Boot) ──► PostgreSQL
            route handlers proxy     /api/v1/*, /health/*     + media volume
                                         ▲
Website ─────────────────────────────────┘   public, read-only: /content-types, /content/**, /media/*/file
```

## Principles (inherited from Blog CMS)

- **The browser never talks to the backend directly.** Server components and route handlers in `frontend/`
  call the backend using `BACKEND_API_URL` (server-side only), so the backend needs no CORS configuration and
  can stay on a private network. Websites that consume content should fetch on their server too.
- **One response envelope** (`{data, meta, errors}`), with an `errorCode`, a message and a correlation ID on errors.
- **Schema via migrations only.** Flyway `V{n}__description.sql`; Hibernate only validates. Never edit a migration
  that has been merged; add a new one.
- **Tests run against real Postgres** (Testcontainers), not H2: the schema uses `jsonb` and `pg_trgm`.
- **Single admin account**, configured through the environment, stateless JWT. There are no users or roles.

## One table for every type

`posts` holds all content. Shared columns: `id`, `content_type`, `title`, `slug`, `excerpt`, `content` (Tiptap JSON),
`content_text` (plain text, derived on save, for search), `status`, `published_at`, `created_at`, `updated_at`,
`version`. Type-specific values live in `fields` (`jsonb`), validated in Java by the content-type registry. The
shared columns are never duplicated inside `fields`.

- `UNIQUE (content_type, slug)`: slugs are unique within a type.
- `CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED'))`, `CHECK (jsonb_typeof(fields) = 'object')`.
- There is deliberately **no** check on `content_type`: the registry is the source of truth, so adding a type
  needs no migration.
- Indexes on `(content_type, status, updated_at)` and `(content_type, status, published_at)` serve the admin and
  public lists; trigram indexes serve the substring search.
- `media` and `post_images` (images embedded in a body, derived on save) make an image undeletable while in use.

## Backend layout

```text
io.atomity.generalcms
├── shared/    ApiResponse, ApiError, ApiException, GlobalExceptionHandler, CorrelationFilter, Paging, Slugs, ...
├── auth/      single-admin login, JWT, SecurityConfig (which paths are public)
├── content/   the registry (ContentTypes, ContentTypeDefinition, FieldDefinition, FieldValidator)
│              and the PUBLIC API (ContentController/Service, dto/)
├── post/      the ADMIN API (PostController/Service), entity Post, repository, dto/
└── media/     upload, library and file serving; storage/ has LocalDiskStorageService behind StorageService
```

Code is grouped by feature, then by layer (`controller/ dto/ entity/ repository/ service/`); DTOs are records with
Bean Validation; constructor injection; UUID keys; UTC timestamps.

## Lifecycle and rules (enforced in `Post` and `PostService`)

```text
 create ─► DRAFT ◄──────────── unpublish (also restores an archived item)
             │  publish (title + content + required fields)
             ▼
         PUBLISHED ── archive ─► ARCHIVED
```

- Drafts may be incomplete; only well-formedness of what is present is checked (`FieldValidator.normalize`).
- Publishing checks completeness (`FieldValidator.missingRequired`, title, content) and fails with `422 NOT_PUBLISHABLE`.
- Published content cannot be saved incomplete.
- `publishedAt` is set on first publication and kept across unpublish/republish.
- Every save carries the `version` the editor loaded; a stale one gets `409 VERSION_CONFLICT`.
- The content type is chosen at creation and never changes.
- Public reads (`ContentService`) filter by status in the query, so drafts and archived items are indistinguishable
  from items that do not exist.

## Security notes

- Public paths are listed in one place, `SecurityConfig`: health, login, `GET /content-types`, `GET /content/*`,
  `GET /content/*/slug/*` and `GET /media/*/file`. Everything else needs a valid token.
- Image responses carry `X-Content-Type-Options: nosniff`. The `Content-Disposition` header is built by
  `ContentDispositions` as pure ASCII (an ASCII `filename` plus an RFC 8187 `filename*`), because Tomcat drops
  the whole header for characters above U+00FF. `MediaWireTest` checks this over real HTTP.
- Uploaded file names pass through `Filenames.clean` (base name only, no control characters).

## Frontend

Next.js 16 App Router. `src/app` holds thin route files; `src/modules/<feature>` the screens (`*Canvas.tsx`), one
`api.ts` per feature (one function per backend endpoint) and pure logic that is unit-tested with Vitest;
`src/components/ui` the shared primitives. The admin form is generated from `GET /content-types`.

## Media storage

`LocalDiskStorageService` writes under `MEDIA_STORAGE_DIR` (atomic temp-file-and-move, keys cannot escape the
directory). In Docker that directory is the named volume `media-data`. Another backend can be added behind the
`StorageService` interface (`store`, `load`, `delete`); tests use an in-memory implementation.
