package io.atomity.generalcms.content;

import java.util.List;

/**
 * One type-specific field of a content type.
 *
 * @param name     key inside the item's {@code fields} object, e.g. {@code applyUrl}
 * @param label    shown next to the input in the admin UI
 * @param required enforced when the item is published; drafts may leave it empty
 * @param options  allowed values of a {@link FieldType#SELECT} field, empty for every other type
 */
public record FieldDefinition(String name, String label, FieldType type, boolean required, List<String> options) {

    public static FieldDefinition text(String name, String label, boolean required) {
        return new FieldDefinition(name, label, FieldType.TEXT, required, List.of());
    }

    public static FieldDefinition url(String name, String label, boolean required) {
        return new FieldDefinition(name, label, FieldType.URL, required, List.of());
    }

    public static FieldDefinition date(String name, String label, boolean required) {
        return new FieldDefinition(name, label, FieldType.DATE, required, List.of());
    }

    public static FieldDefinition bool(String name, String label) {
        return new FieldDefinition(name, label, FieldType.BOOLEAN, false, List.of());
    }

    public static FieldDefinition number(String name, String label, boolean required) {
        return new FieldDefinition(name, label, FieldType.NUMBER, required, List.of());
    }

    public static FieldDefinition select(String name, String label, boolean required, List<String> options) {
        return new FieldDefinition(name, label, FieldType.SELECT, required, List.copyOf(options));
    }
}
