# Contributing

Thanks for helping out! By taking part you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
You never need access to Atomity systems: everything runs locally from this repository.

## Setup

Follow [Quick start](README.md#quick-start-docker) in the README. For work on the apps themselves see
[Local development](README.md#local-development-without-containers-for-the-apps).

## Git hooks

`make install` (or `make hooks`) enables the hooks in `.githooks/`:

| Hook | When | What it checks |
|------|------|----------------|
| `pre-commit` | `git commit` | No `.env` files, private keys, conflict markers or files over 5 MB. Staged frontend files: ESLint, type check and production build. Staged backend files: `gradle build`, compile and tests (needs Docker running). |
| `pre-push` | `git push` | Refuses direct pushes to `main` and re-checks outgoing commits for `.env` files, private keys and conflict markers. |

## Workflow

1. Branch from `main`: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`, `docs/<short-name>`.
2. Keep pull requests small and focused on one change.
3. Run the checks before you open the pull request: `make docker-test` and `make docker-check`
   (or `make check` with a local toolchain), plus `make consumer-test` if you touched the example website.
4. Use [Conventional Commits](https://www.conventionalcommits.org/), e.g. `feat: add event content type`.
5. Describe what you changed and how you tested it. Add or update tests for behaviour you change.

## Conventions

Read [docs/architecture.md](docs/architecture.md) first. In short:

**Backend**
- Group code by feature, with `controller/ dto/ entity/ repository/ service/` inside.
- DTOs are Java records with Bean Validation annotations; every response uses `ApiResponse`.
- Schema changes go in a **new** Flyway migration (`V{n}__description.sql`); never edit a merged one.
- A new content type is a registry entry, not a migration: see [docs/adding-a-content-type.md](docs/adding-a-content-type.md).
- Never log secrets or personal data.

**Frontend**
- Colors, radii and fonts come from `src/styles/tokens.css`: no raw hex values in components.
- Server-only environment variables never get the `NEXT_PUBLIC_` prefix.
- One `api.ts` per feature, one function per backend endpoint; keep logic that can be tested out of components.

**Do not**
- Add a dependency on Atomity production services, credentials or infrastructure.
- Commit `.env` files or real secrets (the values in `.env.example` are local-only defaults).

## Ideas for a first contribution

- A new content type (follow the guide above).
- A new field type (a list of strings for `affectedVersions`, for example).
- Better Tiptap rendering in `examples/mock-consumer` (tables, images with captions).
- Search on the admin list by field values, or sorting docs by `fields.order` in the public API.
- Delete/duplicate actions in the admin UI and API.
