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
| DB driver | @prisma/adapter-pg + pg |
| Database | PostgreSQL on Coolify |
| Schema validation | TypeBox (Elysia native) |
| Background jobs | Trigger.dev |
| Email | Resend (default) or self-hosted SMTP / Stalwart — see ADR 0013 |
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

Trigger.dev owns schedules only. Each task dispatches an authenticated request
to the app, where the job runs beside the private database and is guarded by the
durable `JobRun` idempotency ledger.

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

## Post-MVP Services (not in v3)

- **Upstash Redis** - leaderboard caching, rate limiting
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

Vercel auto-deploys via its GitHub integration - no deploy job needed.
