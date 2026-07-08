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

# ── runtime-prebuilt ─────────────────────────────────────────────────────────
# Stage used by CI: the app is already built outside Docker (.output/ present),
# we just copy it in. Uses node:22-slim (glibc) to match the linux-x64-gnu
# native binaries that @resvg/resvg-js traces into .output/server/node_modules.
FROM node:22-slim AS runtime-prebuilt
WORKDIR /app

COPY .output/ ./.output/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
