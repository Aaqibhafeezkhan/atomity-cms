# Mock consumer

A tiny website that reads **published** content from the Atomity CMS public API and renders it. It
shows how an independent site can consume the CMS. It is an example, not Atomity's website: the CMS
decides nothing about how pages look or which URLs they use, and this example picks its own routes
(`/news`, `/careers`, `/docs`, `/kb`).

- Zero dependencies, plain Node.js (>= 20), server-side `fetch` only (the backend has no CORS configuration).
- `server.mjs`: the pages. `render.mjs`: turns the Tiptap JSON body into escaped HTML (headings, lists,
  quotes, code, links, images, bold/italic/strike/code marks; unknown nodes keep their text).
- `seed.mjs`: creates a draft of each type through the admin API, proves drafts are not public, shows an
  incomplete career being refused, publishes, and reads everything back. Exits non-zero on any failed check.

## Run it

From the repository root, with the stack running (`make up`):

```bash
make demo            # starts the site on http://localhost:4000 and runs the seed
make consumer-test   # unit tests of the renderer
```

Configuration: `CMS_API_URL` (default `http://localhost:8080`; `http://backend:8080` in Compose), `PORT`
(default `4000`), and for the seed `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (default `admin@example.com` / `admin`).

## Adding another type

Add it to `ROUTES` and `TITLES` in `server.mjs` and to `ITEMS` in `seed.mjs`.
