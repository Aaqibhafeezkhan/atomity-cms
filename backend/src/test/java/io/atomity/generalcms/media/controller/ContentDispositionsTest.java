package io.atomity.generalcms.media.controller;

import org.junit.jupiter.api.Test;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class ContentDispositionsTest {

    @Test
    void plainAsciiNamesGetOnlyTheSimpleParameter() {
        assertThat(ContentDispositions.inline("photo.png")).isEqualTo("inline; filename=\"photo.png\"");
        assertThat(ContentDispositions.inline("a-b_c.2.jpg")).isEqualTo("inline; filename=\"a-b_c.2.jpg\"");
    }

    @Test
    void otherNamesGetAnAsciiFallbackAndAnEncodedRealName() {
        assertThat(ContentDispositions.inline("café.png"))
                .isEqualTo("inline; filename=\"caf_.png\"; filename*=UTF-8''caf%C3%A9.png");
        assertThat(ContentDispositions.inline("封面.png"))
                .isEqualTo("inline; filename=\"__.png\"; filename*=UTF-8''%E5%B0%81%E9%9D%A2.png");
        assertThat(ContentDispositions.inline("my photo.png"))
                .isEqualTo("inline; filename=\"my_photo.png\"; filename*=UTF-8''my%20photo.png");
        assertThat(ContentDispositions.inline("😀.png"))
                .isEqualTo("inline; filename=\"_.png\"; filename*=UTF-8''%F0%9F%98%80.png");
    }

    @Test
    void quotesBackslashesSemicolonsAndPercentsNeverReachTheQuotedString() {
        for (String name : new String[] {"report\"final.png", "a\\b.png", "a;b.png", "100%.png", "a'b(1)*.png", "x\"; y=z.png"}) {
            String header = ContentDispositions.inline(name);
            String fallback = header.substring("inline; filename=\"".length(), header.indexOf('"', "inline; filename=\"".length()));
            assertThat(fallback).as(name).matches("[A-Za-z0-9._-]+");
            assertThat(header).as(name).contains("; filename*=UTF-8''");
            assertThat(decode(header)).as(name).isEqualTo(name);
        }
    }

    @Test
    void controlCharactersAreEncodedNotEmitted() {
        String header = ContentDispositions.inline("a\r\nX-Injected: 1.png");
        assertThat(header).doesNotContain("\r").doesNotContain("\n");
        assertThat(header).contains("%0D%0A");
        assertThat(isPrintableAscii(header)).isTrue();
    }

    @Test
    void namesWithoutALetterOrDigitFallBackToDownload() {
        assertThat(ContentDispositions.inline("封面")).startsWith("inline; filename=\"download\"; filename*=UTF-8''");
        assertThat(ContentDispositions.inline("...")).startsWith("inline; filename=\"download\"");
        assertThat(ContentDispositions.inline("")).startsWith("inline; filename=\"download\"");
        assertThat(ContentDispositions.inline(null)).startsWith("inline; filename=\"download\"");
    }

    @Test
    void headerIsAlwaysPrintableAscii() {
        for (String name : new String[] {"café.png", "封面.png", "😀.png", "a‮b.png", "\u0000x.png", "tab\there.png"}) {
            assertThat(isPrintableAscii(ContentDispositions.inline(name))).as(name).isTrue();
            assertThat(decode(ContentDispositions.inline(name))).as(name).isEqualTo(name);
        }
    }

    private static boolean isPrintableAscii(String header) {
        return header.chars().allMatch(c -> c >= 0x20 && c <= 0x7E);
    }

    /** The real name, as a client reads it from filename* (percent-decoded UTF-8); the plain name when there is no filename*. */
    private static String decode(String header) {
        int star = header.indexOf("filename*=UTF-8''");
        if (star < 0) {
            return header.substring(header.indexOf('"') + 1, header.lastIndexOf('"'));
        }
        return URLDecoder.decode(header.substring(star + "filename*=UTF-8''".length()), StandardCharsets.UTF_8);
    }
}
