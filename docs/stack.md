# Stack

## Architecture

TanStack Start (SPA, no SSR) deployed as a Docker image on Coolify. Elysia is mounted inside TanStack Start's server to catch all `/api/*` routes. Eden Treaty provides end-to-end type safety between client and server with zero codegen.

```
TanStack Start (Coolify)
├── client: TanStack Router - SPA, no SSR
└── server: Elysia (via TanStack Start middleware)
    ├── /api/auth/*  → Better Auth (+ Polar plugin)
    ├── /api/*       → Elysia routes (Eden Treaty contract)
    └── /*           → SPA shell
```

## Project Structure

```
pstrack/
├── src/
│   ├── client/
│   │   ├── routes/          # TanStack Router pages
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Client utilities, eden client
│   ├── server/
│   │   ├── routes/          # Elysia route groups
│   │   ├── services/        # Business logic
│   │   ├── jobs/            # Trigger.dev job definitions
│   │   ├── emails/          # React Email templates
│   │   └── lib/             # Auth, db, sentry setup
│   ├── db/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── shared/
│       └── types/           # Types shared across client + server
├── package.json
├── tsconfig.json
├── app.config.ts            # TanStack Start config
└── .env
```

## Client

| Purpose | Technology |
|---|---|
| Meta-framework | TanStack Start |
| Routing | TanStack Router (file-based) |
| Data fetching | TanStack Query |
| Tables | @tanstack/react-table |
| UI | ShadCN + Tailwind CSS |
| Animation | Motion (Framer Motion) |
| Icons | tabler/icons-react |
| Toast | Sileo |
| Charts | recharts |
| URL state | nuqs |
| Forms | React Hook Form + Zod + @hookform/resolvers |
| State | Zustand |
| Error boundaries | react-error-boundary |
| Avatars | hashvatar (deterministic from username hash, no uploads) |
| Emails | React Email |

## Server

| Purpose | Technology |
|---|---|
| HTTP framework | Elysia |
| API contract | Eden Treaty |
| Auth | Better Auth + Polar plugin |
| ORM | Prisma |
| DB driver | `@prisma/adapter-pg` for PostgreSQL; Neon adapter retained for Vercel staging |
| Database | PostgreSQL on Coolify |
| Schema validation | TypeBox (Elysia native) |
| Background jobs | Trigger.dev |
| Email | Stalwart SMTP production target (#289); log-only staging; Resend retained pending retirement |
| Error tracking | Sentry |
| Payments | Polar (via Better Auth plugin) |
| Logging | pino |
| CORS | @elysiajs/cors |
| Rate limiting | @elysiajs/rate-limit |
| Bearer auth | @elysiajs/bearer |
| API docs | @elysiajs/swagger |

## External APIs

- LeetCode GraphQL API - submission verification
- Codeforces API - submission verification

## Trigger.dev Jobs

The #279/#290 target keeps Trigger.dev schedule-only. Tasks dispatch authenticated
requests to the app, where jobs run beside the private database and use the
durable `JobRun` idempotency ledger; consult those issues for deployment proof.

| Job | Trigger | Description |
|---|---|---|
| `assign-daily-problem` | Cron: midnight | Assigns next NeetCode 250 problem to all active groups |
| `mark-missed` | Cron: midnight | Marks users missing for their primary group's previous daily problem when no solve/pause row exists |
| `expire-join-requests` | Cron: every hour | Marks PENDING requests older than 1 day as EXPIRED |
| `reset-monthly-counters` | Cron: 1st of month | Resets monthly pause and verification counters |
| `expire-admin-pro-grants` | Cron: daily | Revokes expired admin-granted Pro access |
| `purge-system-events` | Cron: monthly | Applies event and JobRun retention policies |
| `reconcile-points` | Cron: daily at 00:30 UTC | Checks ordered-ledger/cache equality and sends aggregate-only drift alerts |
| `send-weekly-digest` | Cron: Monday | Sends the weekly admin digest |

## Environment topology

| Environment | Compute | Database | Redis | Email |
|---|---|---|---|---|
| Local | Bun/portless | local PostgreSQL | local Redis | log by default |
| Staging (`stage`) | Vercel Node runtime | isolated Neon | absent; CI + production canary | log only |
| Production (`main`) | Bun OCI image on Coolify | private PostgreSQL | target: private Redis; deployment proof tracked in #288 | target: private Stalwart SMTP; rollout proof tracked in #289 |

The required Trigger.dev design is schedule-only authenticated HTTP dispatch
without production database credentials; deployment proof remains on #279/#290.
Detailed boundaries and runbooks live in [`OPERATIONS.md`](./OPERATIONS.md).

## Post-MVP Services (not in v3)

- **Redis** (self-hosted, Bun native client - ADR 0011) - leaderboard caching, rate limiting
- **Upstash Realtime** - in-app notification inbox, WebSocket feed
- **PostHog** - product analytics

## Utilities

| Purpose | Technology |
|---|---|
| ID generation | nanoid |
| JSON serialization (with Dates) | superjson |
| Date formatting | date-fns |
| Status/enum pattern matching | ts-pattern |

## Testing

| Purpose | Technology |
|---|---|
| Unit tests | vitest |

## Tooling

| Purpose | Technology |
|---|---|
| Runtime + package manager | Bun |
| Type checking | TypeScript |
| Linting + formatting | Biome |
| Git hooks | Lefthook (pre-commit: `biome check --write`, pre-push: typecheck) |
| Env validation | T3-env |
| Unused code | Knip |
| CI/CD | GitHub Actions |

## GitHub Actions

**`ci.yml`** - runs on every PR (all jobs in parallel):

```yaml
- cache: ~/.bun/install/cache
- typecheck:  bun run typecheck
- lint:       bun run biome ci
- knip:       bun run knip
- test:       bun run test (vitest run)
- build:      bun run build
```

**`release.yml`** - runs on merge to main:

```yaml
- same quality + test + build jobs
- sentry: upload source maps (SENTRY_AUTH_TOKEN)
```

Vercel deploys only application staging from `stage`. Production images are
built from `main`, published to GHCR, and deployed through Coolify. See
[`BRANCHING.md`](./BRANCHING.md), [`STAGING.md`](./STAGING.md), and
[`OPERATIONS.md`](./OPERATIONS.md).
