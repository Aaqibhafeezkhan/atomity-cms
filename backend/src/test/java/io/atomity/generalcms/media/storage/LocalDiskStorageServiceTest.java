package io.atomity.generalcms.media.storage;

import io.atomity.generalcms.shared.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalDiskStorageServiceTest {

    @TempDir
    Path dir;

    @Test
    void storesLoadsAndDeletes() throws IOException {
        var storage = new LocalDiskStorageService(dir.resolve("media"));
        storage.store("2026/10/a.png", new byte[] {1, 2, 3});

        assertThat(storage.load("2026/10/a.png").getContentAsByteArray()).containsExactly(1, 2, 3);
        assertThat(Files.list(dir.resolve("media/2026/10"))).hasSize(1); // no temp file left behind

        storage.delete("2026/10/a.png");
        storage.delete("2026/10/a.png"); // deleting twice is fine
        assertThatThrownBy(() -> storage.load("2026/10/a.png")).isInstanceOf(ApiException.class);
    }

    @Test
    void storedFilesSurviveANewInstanceOnTheSameDirectory() throws IOException {
        new LocalDiskStorageService(dir).store("k.png", new byte[] {9});
        assertThat(new LocalDiskStorageService(dir).load("k.png").getContentAsByteArray()).containsExactly(9);
    }

    /** The other tests build the class by hand; this one lets Spring wire it, as it does in the running app. */
    @Test
    void springCanCreateItFromTheConfiguredDirectory() throws IOException {
        new ApplicationContextRunner()
                .withBean(StorageProperties.class, () -> new StorageProperties(dir.resolve("wired").toString()))
                .withBean(LocalDiskStorageService.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    context.getBean(StorageService.class).store("a.png", new byte[] {7});
                });
        assertThat(Files.readAllBytes(dir.resolve("wired/a.png"))).containsExactly(7);
    }

    @Test
    void keysCannotEscapeTheRoot() {
        var storage = new LocalDiskStorageService(dir.resolve("media"));
        assertThatThrownBy(() -> storage.store("../outside.png", new byte[] {1})).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.load("../../etc/passwd")).isInstanceOf(IllegalArgumentException.class);
        assertThat(Files.exists(dir.resolve("outside.png"))).isFalse();
    }
}
