package io.atomity.generalcms.media.controller;

import io.atomity.generalcms.media.dto.MediaResponse;
import io.atomity.generalcms.media.dto.UpdateMediaRequest;
import io.atomity.generalcms.media.entity.Media;
import io.atomity.generalcms.media.service.MediaService;
import io.atomity.generalcms.media.storage.StorageService;
import io.atomity.generalcms.shared.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

    private final MediaService mediaService;
    private final StorageService storage;

    public MediaController(MediaService mediaService, StorageService storage) {
        this.mediaService = mediaService;
        this.storage = storage;
    }

    @GetMapping
    public ApiResponse<List<MediaResponse>> list() {
        return ApiResponse.ok(mediaService.list());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MediaResponse>> upload(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(mediaService.upload(file)));
    }

    @PatchMapping("/{id}")
    public ApiResponse<MediaResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateMediaRequest request) {
        return ApiResponse.ok(mediaService.updateAltText(id, request.altText()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        mediaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * The image itself. Public (see SecurityConfig) so published pages can embed it.
     * A media id never points at different bytes, so it can be cached forever.
     */
    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> file(@PathVariable UUID id) {
        Media media = mediaService.get(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(media.getContentType()))
                .contentLength(media.getSizeBytes())
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDispositions.inline(media.getOriginalFilename()))
                .header("X-Content-Type-Options", "nosniff")
                .body(storage.load(media.getStorageKey()));
    }
}
