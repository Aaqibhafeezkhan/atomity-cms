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

How to choose an issue, claim it and take it to a merged pull request is in the README under
[Picking up a task](README.md#picking-up-a-task). Internship candidates and regular contributors follow the
same rules:

1. Fork the repository, then branch from `main`: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`, `docs/<short-name>`.
2. Keep pull requests small and focused on one change: one issue per pull request, unless the maintainers agree otherwise in the issue.
3. Run the checks before you open the pull request: `make docker-test` and `make docker-check`
   (or `make check` with a local toolchain), plus `make consumer-test` if you touched the example website.
4. Use [Conventional Commits](https://www.conventionalcommits.org/), e.g. `feat: add event content type`.
5. Describe what you changed and how you tested it. Add or update tests for behaviour you change.
6. Answer review comments in the pull request and push follow-up commits to the same branch.

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

## Reporting bugs and ideas

Open an issue and pick the form that fits: bug report, feature request, documentation issue, or
question/discussion. The issue chooser also offers a form for public, non-sensitive security hardening topics.
After you open a new issue, wait for a maintainer to confirm the scope before you start implementing it, then
claim it with a comment (see [Picking up a task](README.md#picking-up-a-task)). Pull requests use a template
with a description, how you tested it and a checklist; fill in what applies.

For a security vulnerability, never open an issue: follow [SECURITY.md](SECURITY.md) and report it privately.

## Ideas for a first contribution

Open issues labelled `good first issue` or `help wanted` come first. The ideas below are not tasks until a
maintainer has confirmed the scope in an issue: open a feature request, then follow the steps above.

- A new content type (follow the guide above).
- A new field type (a list of strings for `affectedVersions`, for example).
- Better Tiptap rendering in `examples/mock-consumer` (tables, images with captions).
- Search on the admin list by field values, or sorting docs by `fields.order` in the public API.
- Delete/duplicate actions in the admin UI and API.
