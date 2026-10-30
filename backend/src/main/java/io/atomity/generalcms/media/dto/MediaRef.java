package io.atomity.generalcms.media.dto;

import io.atomity.generalcms.media.entity.Media;

import java.util.UUID;

/** An image as embedded in a post or author response. */
public record MediaRef(UUID id, String url, String altText) {

    public static MediaRef of(Media media) {
        return media == null ? null : new MediaRef(media.getId(), fileUrl(media.getId()), media.getAltText());
    }

    /** Relative URL the file is served from (see MediaController#file). */
    public static String fileUrl(UUID id) {
        return "/api/v1/media/" + id + "/file";
    }
}
