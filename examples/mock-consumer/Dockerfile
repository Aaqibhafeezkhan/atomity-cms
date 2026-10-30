FROM node:24-alpine
WORKDIR /app

COPY package.json server.mjs render.mjs seed.mjs ./

RUN addgroup -S consumer && adduser -S consumer -G consumer
USER consumer

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:4000/healthz || exit 1

CMD ["node", "server.mjs"]
