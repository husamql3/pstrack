# Bun runtime and native Redis client

PStrack production runs on the Bun runtime, and Redis access uses Bun's native Redis client instead of an npm Redis client.

The project already uses Bun for local development, scripts, dependency installation, tests, and builds. Running the production container with Bun keeps the runtime consistent across development, CI, and production. Using Bun's native Redis client also avoids adding `redis` or `ioredis` when PStrack only needs straightforward Redis operations such as `get`, `set`, `del`, and TTL-backed cache writes.

This means the production Docker image must use a Bun version that includes the native Redis client, and the Redis service must be compatible with Bun's Redis client requirements.
