# Multi-stage so `docker compose up` works from a fresh clone with no local JDK.
# The builder is the official Gradle image (same Gradle 8.11.1 and JDK 21 as the wrapper) so the
# build only needs Docker Hub and Maven Central, not a download of the wrapper's Gradle distribution.
FROM gradle:8.11.1-jdk21-alpine AS builder
WORKDIR /workspace

# Dependencies first: this layer is reused until the build files change.
COPY settings.gradle.kts build.gradle.kts gradle.properties ./
COPY gradle gradle
RUN gradle dependencies --no-daemon --console=plain > /dev/null

COPY src src
RUN gradle bootJar --no-daemon --console=plain -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S atomitycms && adduser -S atomitycms -G atomitycms

# Uploaded images are written here. docker-compose.yml mounts a named volume on it; creating
# the directory with the right owner first makes the volume writable for the non-root user.
RUN mkdir -p /data/media && chown atomitycms:atomitycms /data/media
ENV MEDIA_STORAGE_DIR=/data/media

COPY --from=builder /workspace/build/libs/*.jar app.jar

USER atomitycms

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8080/health/readiness || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
