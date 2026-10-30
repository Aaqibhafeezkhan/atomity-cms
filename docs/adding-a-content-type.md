# Adding a content type

A content type is one entry in a Java list. The database, the public API and the admin form all read that
list, so a new type needs **no migration and no new endpoint**.

## 1. Describe it

Add an entry to [`ContentTypes`](../backend/src/main/java/io/atomity/generalcms/content/ContentTypes.java):

```java
new ContentTypeDefinition("event", "Event",
        "Meetups, webinars and conferences.",
        new Destination("website", "/events"),          // descriptive only; route may be null
        List.of(
                text("venue", "Venue", true),                    // required to publish
                date("startsOn", "Starts on", true),
                url("registrationUrl", "Registration URL", false),
                bool("online", "Online")))
```

Helpers: `text`, `url`, `date`, `bool`, `number` and `select(name, label, required, options)`. The `key`
(`event`) becomes the API path segment (`/api/v1/content/event`) and is stored in `posts.content_type`; choose
it carefully because renaming it later means migrating rows. `required` is enforced on publish only; drafts
may leave it empty. Registry order is the order types appear in the API and the admin UI.

## 2. Test it

- `ContentTypesTest` (unit): add what is special about the new fields.
- `ContentApiTest` (integration): add the type to `VALID_FIELDS`, and the existing tests that loop over the
  types (create, update, publish, public filter) will exercise it. Add a case for its required fields.

Run `make docker-test`.

## 3. Show it (optional)

- Admin UI: nothing to do; the form renders the fields it gets from `GET /api/v1/content-types`.
- Example website: add the type to `ROUTES` and `TITLES` in `examples/mock-consumer/server.mjs` and to `ITEMS`
  in `seed.mjs`.

## When a new *kind of field* is needed

A new `FieldType` (for example a list of strings) touches three places: the enum
(`FieldType`), the `switch` in `FieldValidator.check`, and an input in the admin form. Add tests for each.

## Slugs and removing types

Slugs are unique per type, so `/news/launch` and `/docs/launch` can coexist. Removing a type from the
registry makes its existing rows unreadable through the API (`UNKNOWN_CONTENT_TYPE`/`404`); migrate or delete
them first.
