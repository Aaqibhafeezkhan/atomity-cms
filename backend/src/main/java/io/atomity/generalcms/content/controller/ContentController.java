package io.atomity.generalcms.content.controller;

import io.atomity.generalcms.content.ContentTypeDefinition;
import io.atomity.generalcms.content.ContentTypes;
import io.atomity.generalcms.content.dto.ContentListQuery;
import io.atomity.generalcms.content.dto.ContentResponse;
import io.atomity.generalcms.content.dto.ContentSummaryResponse;
import io.atomity.generalcms.content.service.ContentService;
import io.atomity.generalcms.shared.ApiResponse;
import io.atomity.generalcms.shared.PageMeta;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public, read-only API that websites use to fetch published content. Public: see SecurityConfig. */
@RestController
@RequestMapping("/api/v1")
public class ContentController {

    private final ContentService contentService;

    public ContentController(ContentService contentService) {
        this.contentService = contentService;
    }

    /** GET /api/v1/content-types: every content type with its fields and its destination metadata. */
    @GetMapping("/content-types")
    public ApiResponse<List<ContentTypeDefinition>> types() {
        return ApiResponse.ok(ContentTypes.all());
    }

    /** GET /api/v1/content/{type}?q&sort&direction&page&size: published items of one type, newest first. */
    @GetMapping("/content/{type}")
    public ApiResponse<List<ContentSummaryResponse>> list(@PathVariable String type, @Valid ContentListQuery query) {
        Page<ContentSummaryResponse> page = contentService.list(type, query);
        return ApiResponse.ok(page.getContent(), PageMeta.of(page));
    }

    /** GET /api/v1/content/{type}/slug/{slug}: one published item with its full body. */
    @GetMapping("/content/{type}/slug/{slug}")
    public ApiResponse<ContentResponse> getBySlug(@PathVariable String type, @PathVariable String slug) {
        return ApiResponse.ok(contentService.getBySlug(type, slug));
    }
}
