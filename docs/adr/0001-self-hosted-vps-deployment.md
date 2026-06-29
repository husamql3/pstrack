# ADR 0001 — Migrate deployment from Vercel to self-hosted VPS

**Date:** 2026-06-29  
**Status:** Accepted

---

## Context

PStrack launched on Vercel (managed serverless) with Neon (managed Postgres), Upstash (managed Redis), and Resend (managed email). As the platform matures the priority shifts from "get it running fast" to "own the stack" — predictable billing, no vendor rate limits, and full operational control over every layer.

The primary driver is **control**, not cost (though the cost outcome is favourable: ~€10/mo vs unpredictable Vercel function billing at scale).

---

## Decision

Migrate the entire production stack to a self-hosted Hetzner VPS managed by Coolify. Build Docker images in GitHub Actions, push to GHCR, and trigger Coolify deploys via webhook.

### Infrastructure

| Layer | Before | After |
|---|---|---|
| Compute | Vercel serverless | Hetzner CAX21 (4 vCPU ARM64, 8 GB RAM, €7.49/mo) |
| Orchestration | Vercel platform | Coolify (self-hosted on same VPS) |
| Database | Neon (managed Postgres) | Postgres container on Coolify |
| Redis | Upstash (managed, REST API) | Redis container on Coolify |
| Email | Resend | Postal (self-hosted on same VPS) |
| Background jobs | Trigger.dev cloud | Trigger.dev cloud (unchanged) |
| Error tracking | Sentry cloud | Sentry cloud (unchanged) |
| Image registry | N/A | GHCR (`ghcr.io/org/pstrack`) |

### Runtime

Switch Nitro preset from `vercel` to `bun`. The Docker image uses `oven/bun` as the base image and runs the app as `bun .output/server/index.mjs`. This is consistent with the rest of the project (dev, CI, and all scripts already run on Bun).

### CI/CD pipeline (replacing the Vercel deploy job)

```
typecheck → lint → knip → test → build Docker image → push to GHCR → curl Coolify webhook
```

The image is tagged with both the commit SHA and `latest`. Coolify deploys on webhook receipt, not on a registry poll.

### Zero-downtime deploys

Coolify is configured with a health check on `GET /api/v3/health` (existing endpoint). It starts the new container, waits for the health check to pass (30s grace period), then terminates the old container. No downtime during normal deploys.

### Database backups

A dedicated backup repository runs a nightly `pg_dump` cron that pushes snapshots as commits. This is not point-in-time recovery — it is daily snapshot recovery. Acceptable for PStrack's current risk profile.

### Email

Postal runs on the same VPS. The Resend SDK is replaced with Postal's HTTP API (structurally identical: POST with `to`, `from`, `subject`, `html`). React Email templates are unchanged — they produce HTML strings that either transport can send.

### Redis client

The Upstash REST SDK (`@upstash/redis`) is replaced with a standard Redis client (`ioredis` or `redis` npm package) pointing at the Coolify-managed Redis container. The change is isolated to `src/server/lib/redis.ts`.

### Cutover strategy

Hard cutover during the **1–2am UTC maintenance window** — after `assign-daily-problem` fires at midnight and before users are likely solving problems.

Steps:
1. Lower DNS TTL to 60s 24 hours in advance
2. Provision Hetzner CAX21, install Coolify
3. Stand up Postgres + Redis containers on Coolify
4. Set up Postal, configure SPF/DKIM/DMARC for the sending domain
5. Restore Neon data: `pg_dump` from Neon → `pg_restore` to Coolify Postgres
6. Run `prisma migrate deploy` against self-hosted Postgres to verify schema parity
7. Build and push the Docker image to GHCR
8. Deploy to Coolify, verify health check passes
9. Update `BETTER_AUTH_URL` env var and OAuth callback URLs in Google + GitHub consoles
10. Update Polar webhook endpoint URL
11. Flip DNS to Hetzner IP
12. Monitor logs for 30 minutes; roll back to Vercel (DNS flip back) if critical errors appear
13. Once stable: delete Vercel project, remove Neon + Upstash + Resend accounts

---

## Alternatives considered

**Stay on Vercel indefinitely** — eliminated because it conflicts with the goal of full stack ownership and creates a hard dependency on Vercel's pricing model as traffic grows.

**Partial migration (keep Neon/Resend, move only compute)** — eliminated because it leaves managed dependencies that undermine the control motivation. If we're migrating, we migrate completely.

**Self-host Trigger.dev** — rejected. Trigger.dev OSS requires Postgres + Redis + Electric + Kafka for high volume. The background jobs (daily cron + webhook tasks) are low-volume; the operational cost of self-hosting outweighs any benefit.

**Self-host Sentry / GlitchTip** — rejected for the same reason. Error data is not user PII; the free tier is sufficient; the ops overhead is not justified.

**Two-server setup (app VPS + mail VPS)** — considered to prevent Postal's memory competing with the app. Rejected in favour of simplicity; CAX21's 8 GB RAM provides sufficient headroom for all services.

---

## Consequences

- **Ops responsibility**: backups, Postgres maintenance, Redis memory management, Postal deliverability (SPF/DKIM/DMARC, bounce handling) are now owned by the team.
- **ARM64 build**: Docker image must target `linux/arm64`. GitHub Actions `docker/setup-qemu-action` + `docker/setup-buildx-action` handles cross-compilation or native ARM runners can be used.
- **OAuth callback URLs**: Must be updated in Google Cloud Console and GitHub OAuth App settings before cutover.
- **Polar webhook**: Must be updated to point at the new domain before cutover.
- **`DIRECT_URL` pattern**: Neon required two connection strings (pooled + direct). Self-hosted Postgres uses a single direct connection string; `DIRECT_URL` can be set equal to `DATABASE_URL` or the two-URL Prisma config can be simplified.
