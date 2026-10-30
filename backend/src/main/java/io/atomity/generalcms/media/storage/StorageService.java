
package io.atomity.generalcms.media.storage;

import org.springframework.core.io.Resource;

/**
 * Abstraction for storing, retrieving, and deleting media files.
 * Implementations: local disk (the default) or an in-memory store for tests; another backend can be added behind this interface.
 */
public interface StorageService {

    /**
     * Stores the bytes under {@code key}, a relative path such as
     * {@code 2026/10/<uuid>.png}.
     *
     * @param key     relative storage path
     * @param content file contents
     */
    void store(String key, byte[] content);

    /**
     * Loads a stored file.
     *
     * @param key relative storage path
     * @return the stored file as a resource
     * @throws io.atomity.generalcms.shared.ApiException if the file is missing
     */
    Resource load(String key);

    /**
     * Deletes a stored file. A missing file is not an error.
     *
     * @param key relative storage path
     */
    void delete(String key);
}
