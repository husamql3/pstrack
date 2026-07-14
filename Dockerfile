# ── builder ───────────────────────────────────────────────────────────────────
# Optional target for building entirely inside Docker (e.g. local builds).
# CI builds the app first and uses the runtime-prebuilt target below.
FROM oven/bun:1.2-slim AS builder
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

# Nitro leaves Resvg external to the server bundle. Install production packages
# in an isolated stage so the runtime can copy only that native dependency.
FROM oven/bun:1.3-slim AS runtime-deps
WORKDIR /app

COPY bun.lock package.json ./
RUN bun install --frozen-lockfile --production --ignore-scripts

# ── runtime-prebuilt ─────────────────────────────────────────────────────────
# Stage used by CI: the app is already built outside Docker (.output/ present),
# we just copy it in. Uses node:22-slim (glibc) to match the linux-x64-gnu
# native binaries that @resvg/resvg-js traces into .output/server/node_modules.
FROM node:22-slim AS runtime-prebuilt
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 pstrack \
    && useradd --uid 10001 --gid 10001 --no-create-home --home-dir /nonexistent \
        --shell /usr/sbin/nologin pstrack

COPY --from=runtime-deps /app/node_modules/@resvg ./node_modules/@resvg
COPY .output/ ./.output/

# Fail the image build if the native OG renderer cannot load and produce PNG.
RUN node --input-type=module -e 'const { Resvg } = await import("@resvg/resvg-js"); const png = new Resvg("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1\" height=\"1\"/>").render().asPng(); if (png.length === 0) process.exit(1)'

ENV NODE_ENV=production
ENV PORT=3000
ENV HOME=/nonexistent
ENV TMPDIR=/tmp

EXPOSE 3000

# Lets Coolify gate the rolling swap on real readiness: it waits for the new
# container to report healthy before routing traffic to it and stopping the old
# one. Without this, Coolify falls back to stop-then-start (= downtime).
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://localhost:3000/api/v3/health || exit 1

USER 10001:10001

CMD ["node", ".output/server/index.mjs"]
