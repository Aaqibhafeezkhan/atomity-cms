package io.atomity.generalcms.media.controller;

import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;

/**
 * Builds the {@code Content-Disposition} header of an image response from its original file name.
 *
 * <p>The header must be pure ASCII on the wire: embedded Tomcat drops the whole header when it holds a
 * character above U+00FF (for example a CJK file name), and sends raw Latin-1 bytes for accented ones.
 * So the name is sent twice, as RFC 6266 describes: a plain ASCII fallback in {@code filename}, and the
 * real name, percent-encoded as UTF-8, in {@code filename*} (RFC 8187), which browsers prefer.
 *
 * <p>The header is assembled by hand on purpose. The fallback only ever contains letters, digits and
 * {@code . _ -} (everything else becomes {@code _}), so it needs no quoting or escaping, and
 * {@link UriUtils#encode} percent-encodes everything except {@code A-Za-z0-9-._~}, which keeps the
 * {@code filename*} value inside the RFC 8187 character set. It also avoids Spring's
 * {@code ContentDisposition.Builder#filename(String, Charset)}, which is affected by CVE-2025-41234 on
 * Spring Framework before 6.2.8.
 */
final class ContentDispositions {

    private static final String DEFAULT_NAME = "download";

    private ContentDispositions() {
    }

    static String inline(String originalFilename) {
        String name = originalFilename == null ? "" : originalFilename;
        String fallback = asciiFallback(name);
        String header = "inline; filename=\"" + fallback + "\"";
        if (!fallback.equals(name)) {
            header += "; filename*=UTF-8''" + UriUtils.encode(name, StandardCharsets.UTF_8);
        }
        return header;
    }

    /** Safe characters stay, anything else becomes '_'; a name with no letter or digit left becomes "download". */
    static String asciiFallback(String name) {
        StringBuilder out = new StringBuilder(name.length());
        boolean meaningful = false;
        for (int i = 0; i < name.length(); ) {
            int cp = name.codePointAt(i);
            i += Character.charCount(cp);
            if (cp < 0x80 && (Character.isLetterOrDigit(cp))) {
                meaningful = true;
                out.append((char) cp);
            } else if (cp == '.' || cp == '-' || cp == '_') {
                out.append((char) cp);
            } else {
                out.append('_');
            }
        }
        return meaningful ? out.toString() : DEFAULT_NAME;
    }
}
