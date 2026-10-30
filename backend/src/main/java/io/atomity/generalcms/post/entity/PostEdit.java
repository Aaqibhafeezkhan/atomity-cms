package io.atomity.generalcms.post.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.atomity.generalcms.media.entity.Media;

import java.util.Collection;

/** The resolved, validated content of a save: everything a post's editable part consists of. */
public record PostEdit(
        String title,
        String slug,
        String excerpt,
        JsonNode content,
        String contentText,
        ObjectNode fields,
        Collection<Media> inlineImages) {
}
