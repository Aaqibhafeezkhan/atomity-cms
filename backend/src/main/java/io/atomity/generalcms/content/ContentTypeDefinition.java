package io.atomity.generalcms.content;

import java.util.List;

/**
 * Everything the CMS knows about one kind of content: how it is named, which extra fields it has
 * and where it is meant to be shown.
 *
 * @param key         stable identifier used in the API ({@code /api/v1/content/{key}}) and stored in {@code posts.content_type}
 * @param destination descriptive only: the CMS never delivers anything there
 */
public record ContentTypeDefinition(String key, String displayName, String description, Destination destination,
                                    List<FieldDefinition> fields) {

    /**
     * Where a website is expected to show this type. Purely informational metadata for consumers.
     *
     * @param label a short name for the destination, e.g. {@code website}
     * @param route the path on that destination, or {@code null} while it is still undecided
     */
    public record Destination(String label, String route) {
    }

    public FieldDefinition field(String name) {
        return fields.stream().filter(f -> f.name().equals(name)).findFirst().orElse(null);
    }
}
