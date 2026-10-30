package io.atomity.generalcms.media;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

/** Real image bytes for tests, encoded by the JDK (WebP built by hand — ImageIO can't write it). */
public final class TestImages {

    private TestImages() {
    }

    public static byte[] encode(String format, int width, int height) {
        int type = format.equals("jpg") ? BufferedImage.TYPE_INT_RGB : BufferedImage.TYPE_INT_ARGB;
        var image = new BufferedImage(width, height, type);
        var out = new ByteArrayOutputStream();
        try {
            if (!ImageIO.write(image, format, out)) {
                throw new IllegalStateException("No writer for " + format);
            }
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
        return out.toByteArray();
    }

    /** Minimal extended-format (VP8X) WebP header; enough for dimension parsing. */
    public static byte[] webpExtended(int width, int height) {
        ByteBuffer buffer = ByteBuffer.allocate(30).order(ByteOrder.LITTLE_ENDIAN);
        buffer.put("RIFF".getBytes(StandardCharsets.US_ASCII)).putInt(22).put("WEBP".getBytes(StandardCharsets.US_ASCII));
        buffer.put("VP8X".getBytes(StandardCharsets.US_ASCII)).putInt(10).putInt(0);
        putUint24(buffer, width - 1);
        putUint24(buffer, height - 1);
        return buffer.array();
    }

    private static void putUint24(ByteBuffer buffer, int value) {
        buffer.put((byte) value).put((byte) (value >> 8)).put((byte) (value >> 16));
    }
}
