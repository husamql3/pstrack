# Bun runtime and native Redis client

PStrack production runs on the Bun runtime, and Redis access uses Bun's native Redis client instead of an npm Redis client.

The project already uses Bun for local development, scripts, dependency installation, tests, and builds. Running the production container with Bun keeps the runtime consistent across development, CI, and production. Using Bun's native Redis client also avoids adding `redis` or `ioredis` when PStrack only needs straightforward Redis operations such as `get`, `set`, `del`, and TTL-backed cache writes.

This means the production Docker image must use a Bun version that includes the native Redis client, and the Redis service must be compatible with Bun's Redis client requirements.

## Amendment (2026-07-12, #288)

When this decision was recorded, the CI runtime image still ran `node:22-slim`
(chosen to match the glibc `@resvg/resvg-js` binaries) and Redis access still
used the `@upstash/redis` REST client. Issue #288 completed the decision:

- `src/server/lib/redis.ts` now uses Bun's native `RedisClient` against
  `REDIS_URL`: lazy singleton, 5s connection timeout, bounded reconnect
  retries, offline queue only across the retry window, error-level `onclose`
  logging, and close on SIGTERM. `UPSTASH_REDIS_REST_URL/TOKEN` are removed
  from the env schema, `.env.example`, and the staging sync allowlist.
- The `runtime-prebuilt` Docker stage runs `oven/bun:1.3.14-slim` with
  `CMD ["bun", ...]`. The image is Debian/glibc, so the `linux-x64-gnu`
  `@resvg/resvg-js` binaries still load. Nitro leaves the dynamic package
  external, so a dedicated production-dependency stage copies only the
  `@resvg` scope into the final image and runs a build-time native-render
  guard. This is verified again by a container smoke of the built artifact
  (DB-backed health plus the `/api/v3/og` render).
- The `"bun"` module is dynamically imported and marked external in both the
  Vite and Nitro rollup passes. Node-based runtimes (Vitest, the Vercel
  staging functions) still load the server bundle; only an actual Redis call
  fails there, observably, without killing the process.
- Vercel staging intentionally has **no Redis**: its Node functions cannot run
  Bun's client, a private Coolify Redis is unreachable from Vercel, and no
  feature currently reads Redis. Redis behavior (authenticated connections,
  TTL expiry, set membership, duplicate and concurrent writes, reconnect after
  `CLIENT KILL`, bounded initial failure, and bounded queued-command failure
  after an established connection dies) is verified by `bun run verify:redis`
  in CI against a disposable `redis:7` service container, then by a production
  canary after cutover. Transport encryption is optional for a private Docker
  network; deployments that cross an untrusted network must use `rediss://`
  and verify the certificate during the canary.
- Existing Upstash keys are inventoried as aggregate counts on #288 and
  intentionally discarded, not migrated: nothing on `stage` reads Redis, and
  the historical keys were digest-dedupe sets from the abandoned Postal
  branch. No session or auth data ever lived in Redis.
