# ── builder ───────────────────────────────────────────────────────────────────
# Optional target for building entirely inside Docker (e.g. local builds).
# CI builds the app first and uses the runtime-prebuilt target below.
FROM oven/bun:1.3-slim AS builder
WORKDIR /app

COPY bun.lock package.json ./
COPY prisma/ prisma/

RUN bun install --frozen-lockfile

COPY . .

ARG VITE_BASE_URL=http://localhost:3000
ARG VITE_SENTRY_DSN=
ARG VITE_SENTRY_TRACES_SAMPLE_RATE=0
ARG VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE=0
ARG VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE=0

ENV VITE_BASE_URL=$VITE_BASE_URL \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_SENTRY_TRACES_SAMPLE_RATE=$VITE_SENTRY_TRACES_SAMPLE_RATE \
    VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE=$VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE \
    VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE=$VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE

RUN bun run build

# ── runtime-prebuilt ─────────────────────────────────────────────────────────
# Stage used by CI: the app is already built outside Docker (.output/ present),
# we just copy it in. Runs on Bun (ADR 0011) - the native Redis client ships
# with the Bun runtime. oven/bun slim is Debian/glibc, so the linux-x64-gnu
# native binaries @resvg/resvg-js traces into .output/server/node_modules
# still load.
FROM oven/bun:1.3-slim AS runtime-prebuilt
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY .output/ ./.output/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Lets Coolify gate the rolling swap on real readiness: it waits for the new
# container to report healthy before routing traffic to it and stopping the old
# one. Without this, Coolify falls back to stop-then-start (= downtime).
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://localhost:3000/api/v3/health || exit 1

CMD ["bun", ".output/server/index.mjs"]
