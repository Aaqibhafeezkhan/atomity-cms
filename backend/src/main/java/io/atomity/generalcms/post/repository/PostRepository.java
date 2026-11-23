package io.atomity.generalcms.post.repository;

import io.atomity.generalcms.post.entity.Post;
import io.atomity.generalcms.post.entity.PostStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID>, JpaSpecificationExecutor<Post> {

    /** Serialize simultaneous copies of the same source while choosing their slugs. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Post p where p.id = :id")
    Optional<Post> findForDuplication(UUID id);

    boolean existsByContentTypeAndSlug(String contentType, String slug);

    boolean existsByContentTypeAndSlugAndIdNot(String contentType, String slug, UUID id);

    /** Public lookup by slug: only published items are ever exposed. */
    Optional<Post> findByContentTypeAndSlugAndStatus(String contentType, String slug, PostStatus status);
}
