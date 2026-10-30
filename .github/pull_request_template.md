<!--
Title: use Conventional Commits, e.g. "feat: add event content type" or "fix(backend): reject unknown career fields".
Keep the PR small and focused on one change. Delete any section that doesn't apply.
-->

## Description

<!-- What does this change, and why? -->

## Related issue

<!-- Link the issue this closes, or write "None" for a small fix. -->

Closes #

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] New content type or field (also fill in "New content type or field" below)
- [ ] Refactor (no behaviour change)
- [ ] Documentation
- [ ] Build, CI or tooling
- [ ] Breaking change (API, database or config changes that need action from users)

## How I tested it

<!-- How a reviewer can see the change working (and, for a fix, see the bug before it). -->

1.
2.
3.

**Expected result:**

## Screenshots or other evidence

<!-- UI change: before / after screenshots. API change: a sample request and response. Delete otherwise. -->

## Checklist

**Title and scope**
- [ ] The PR title follows `type: short summary` (`feat`, `fix`, `docs`, `chore`, `refactor`, …)
- [ ] The PR is focused on one change

**Tests** (these run in Docker; no local JDK or Node needed)
- [ ] Backend tests pass: `make docker-test`
- [ ] Frontend lint, type check, tests and build pass: `make docker-check`
- [ ] Example website tests pass, if I touched `examples/mock-consumer/`: `make consumer-test`
- [ ] I added or updated tests that cover this change
- [ ] I tried it by hand in the running app (`make up`, then `make demo` for sample content of every type)

**API and compatibility**
- [ ] The public API (`/api/v1/content-types`, `/api/v1/content/...`) and the admin API (`/api/v1/posts`) keep working for existing consumers: no field, route or error code was removed or renamed
- [ ] If the API changed, `docs/api.md` describes it and the change is called out under "Type of change"

**Database**
- [ ] No schema change, or it is in a **new** Flyway migration in `backend/src/main/resources/db/migration/`; no merged migration was edited
- [ ] I checked whether existing rows stay valid (a new content type or field needs no migration)

**New content type or field** (skip if not applicable)
- [ ] Registry entry in `backend/src/main/java/io/atomity/generalcms/content/ContentTypes.java`, with its destination and required fields
- [ ] Validation covers it: required fields are enforced on publish, and a new kind of field also touches `FieldType`, `FieldValidator` and the admin form
- [ ] Tests: `ContentTypesTest` and `ContentApiTest` (add the type to `VALID_FIELDS`)
- [ ] `docs/api.md` and the content types table in the README list it, following `docs/adding-a-content-type.md`
- [ ] The existing types (news, career, docs, kb) behave exactly as before

**Code**
- [ ] The git hooks ran on my commits (enable them with `make hooks`; no `--no-verify`)
- [ ] No hard-coded colours in the frontend: design tokens from `frontend/src/styles/tokens.css` only
- [ ] No secrets, tokens or personal data in code, logs or fixtures

**Docs and config**
- [ ] New environment variables are added to the matching `.env.example` file(s) and the README configuration table
- [ ] README, CONTRIBUTING or `docs/` are updated if behaviour or setup changed
