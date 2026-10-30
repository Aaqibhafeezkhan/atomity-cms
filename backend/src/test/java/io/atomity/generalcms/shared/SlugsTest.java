package io.atomity.generalcms.shared;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SlugsTest {

    @Test
    void slugifiesLikeTheFrontend() {
        assertThat(Slugs.slugify("Hello, Wörld!")).isEqualTo("hello-world");
        assertThat(Slugs.slugify("  --Already--kebab--  ")).isEqualTo("already-kebab");
        assertThat(Slugs.slugify("EU Data Act: 2027")).isEqualTo("eu-data-act-2027");
        assertThat(Slugs.slugify("!!!")).isEmpty();
        assertThat(Slugs.slugify(null)).isEmpty();
    }

    @Test
    void capsLengthWithoutTrailingHyphen() {
        String slug = Slugs.slugify("a".repeat(119) + " b" + "c".repeat(50));
        assertThat(slug).hasSizeLessThanOrEqualTo(120).doesNotEndWith("-");
    }
}
