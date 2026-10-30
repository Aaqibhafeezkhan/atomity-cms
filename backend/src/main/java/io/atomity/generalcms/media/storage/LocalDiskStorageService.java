package io.atomity.generalcms.media.storage;

import io.atomity.generalcms.shared.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * Stores files under {@code generalcms.media.storage.local-directory}. In docker-compose that is a
 * named volume, so uploads survive {@code docker compose down}. Tests use an in-memory store instead.
 */
@Profile("!test")
@Service
public class LocalDiskStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalDiskStorageService.class);

    private final Path root;

    @Autowired
    public LocalDiskStorageService(StorageProperties properties) {
        this(Path.of(properties.localDirectory()));
    }

    /** For tests that point the store at a temporary directory. */
    public LocalDiskStorageService(Path directory) {
        this.root = directory.toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create media storage directory " + root, e);
        }
        log.info("Media storage at {}", root);
    }

    @Override
    public void store(String key, byte[] content) {
        Path target = resolve(key);
        try {
            Files.createDirectories(target.getParent());
            // Write to a temp file and move, so a crash never leaves a half-written image behind.
            Path temp = Files.createTempFile(target.getParent(), ".upload-", ".tmp");
            try {
                Files.write(temp, content);
                Files.move(temp, target, StandardCopyOption.ATOMIC_MOVE);
            } finally {
                Files.deleteIfExists(temp);
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store media file", e);
        }
    }

    @Override
    public Resource load(String key) {
        Path path = resolve(key);
        if (!Files.isRegularFile(path)) {
            throw ApiException.notFound("Media file");
        }
        return new FileSystemResource(path);
    }

    @Override
    public void delete(String key) {
        try {
            Files.deleteIfExists(resolve(key));
        } catch (IOException e) {
            // The row is already gone; an orphaned file is harmless and can be cleaned up later.
            log.warn("Could not delete media file {}", key, e);
        }
    }

    /** Keys are generated server-side, but resolve defensively so none can escape the root. */
    private Path resolve(String key) {
        Path path = root.resolve(key).normalize();
        if (!path.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return path;
    }
}
