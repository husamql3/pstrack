# Stack

## Client

### Framework & Routing

- **React 19**
- **TanStack Start**
- **TanStack Router**
- **TanStack Query**

### UI & Styling

- **ShadCN**
- **shadcnstudio**
- **Tailwind CSS**
- **tabler/icons-react** - Icon library
- **React Email**

### State & Forms

- **Zod**
- **React Hook Form**
- **Zustand**

### Code Display

- **Diffs** - Inline code commenting (line-specific)

---

## Server

### Runtime & Framework

- **Bun** - Runtime (faster than Node.js, native TypeScript)
- **Hono** - Lightweight web framework (20x faster than Express)

### Database & ORM

- **PostgreSQL** - Primary database (Supabase-hosted)
- **Drizzle ORM** - Type-safe ORM
- **Drizzle Kit** - Migrations & schema management

### Caching & Real-time

- **Upstash Redis** - for:
  - Rate limiting
  - Leaderboard caching (sorted sets)
  - Feed caching
- **Upstash Realtime** - for:
  - In-app notifications
  - Live activity feed updates
  - Real-time leaderboard updates
  - Presence indicators (who's online)
  - Pub/sub for user events

### Background Jobs

- **Trigger.dev** - for:
  - Daily problem verification checks
  - Streak calculations
  - Suspension automation
  - Weekly Twitter posts
  - Email batch sends

### Authentication

- **Better-Auth**

### File Storage

- **Supabase Storage** - Avatar uploads
  - Buckets organized by group ID
  - Auto-resize with Sharp before upload
  - CDN delivery
- **Sharp** - Server-side image processing
  - Resize to 256x256 and 64x64
  - Convert to WebP for efficiency

### Email

- **Resend** - email service
- **React Email** - Type-safe email templates

### Validation & Type Safety

- **Zod** - Schema validation
- **T3-env** - Type-safe environment variables

### Monitoring & Analytics

- **Sentry**
- **PostHog**

### External APIs

- **LeetCode GraphQL API** - Submission verification
- **Codeforces API** - Submission verification
- **Twitter API** - Automated leaderboard posts

---

## DevOps & Infrastructure

### Deployment

- **Cloudflare Workers**
- **Cloudflare Pages**

### Hosting & CDN

- **Cloudflare** - Web/Server
- **Supabase** - Storage
- **Upstash** - Redis + Realtime hosting
- **Trigger.dev Cloud** - Background job hosting

### CI/CD

- **GitHub Actions** - Automated workflows:
  - Lint & Format & type-check & tests on PR
  - Deploy to Cloudflare via Wrangler
  - Upload source maps to Sentry

---

## Tooling & DX

### Monorepo Management

- **Turborepo** - Build system and task runner

### Code Quality

- **Oxlint** - Ultra-fast linter (Rust-based)
- **TypeScript** - Type safety across stack

### Git Hooks

- **Lefthook**
  - Pre-commit: lint & format staged files
  - Pre-push: run tests

### Package Management

- **Bun**

### Local Development

- **Docker Compose** - Local Postgres instance
- **Drizzle Studio** - Database GUI
- **Wrangler Dev** - Local Cloudflare Workers emulation

---

## Architecture Diagram

```text
┌───────────────────────────────────────────────────────────────┐
│                      Client Layer (React)                     │
│            TanStack Router + Query + ShadCN                   │
│                  Deployed on Cloudflare Pages                 │
└──────────────────────┬────────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌───────────────────────────────────────────────────────────────┐
│                    Cloudflare Global Network                  │
│              (Edge CDN, DDoS Protection, WAF)                 │
└──────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────────────────────────┐
│                 API Layer (Hono on Bun)                       │
│              Deployed on Cloudflare Workers                   │
├───────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Better-Auth  │  │   Drizzle    │  │    Sentry    │        │
│  │  (Sessions)  │  │     ORM      │  │   (Errors)   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────┬──────────────────┬──────────────────┬────────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Upstash    │  │  Docker      │  │  Supabase    │
│    Redis     │  │  PostgreSQL  │  │   Storage    │
│  (Caching)   │  │  (Database)  │  │  (Avatars)   │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Upstash    │  │ Trigger.dev  │  │   PostHog    │
│  Realtime    │  │ (Background) │  │ (Analytics)  │
│ (WebSocket)  │  │    Jobs      │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://... # For migrations

# Redis & Realtime
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
UPSTASH_REALTIME_URL=
UPSTASH_REALTIME_TOKEN=

# Authentication
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://api.pstrack.tech

# Supabase Storage
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email
RESEND_API_KEY=

# External APIs
LEETCODE_SESSION= # For GraphQL API
CODEFORCES_API_KEY=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=

# Monitoring
SENTRY_DSN=
SENTRY_AUTH_TOKEN= # For source map uploads
SENTRY_ORG=
SENTRY_PROJECT=
POSTHOG_API_KEY=
POSTHOG_PROJECT_ID=

# Background Jobs
TRIGGER_API_KEY=
TRIGGER_API_URL=

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
```

---

## Package Structure

```text
pstrack-v3/
├── apps/
│   ├── www/                 # prelunching website
│   │
│   ├── web/                 # React client
│   │   ├── src/
│   │   │   ├── routes/      # TanStack Router routes
│   │   │   ├── components/  # UI components
│   │   │   ├── lib/         # Utilities
│   │   │   └── hooks/       # Custom hooks
│   │   ├── wrangler.toml    # Cloudflare Pages config
│   │   └── package.json
│   │
│   └── api/                 # Hono API
│       ├── src/
│       │   ├── routes/      # API routes
│       │   ├── lib/         # Business logic
│       │   ├── jobs/        # Trigger.dev jobs
│       │   └── db/          # Drizzle schema & migrations
│       ├── wrangler.toml    # Cloudflare Workers config
│       └── package.json
│
├── packages/
│   ├── db/
│   ├── auth/
│   ├── types/
│   ├── env/
│   ├── infra/
│   └── tsconfig/
│
├── docker-compose.yml       # Local Postgres
├── turbo.json
└── package.json
```

---

## Cloudflare Configuration

### Workers Configuration (apps/api/wrangler.toml)

```toml
name = "pstrack-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
name = "pstrack-api"
routes = [
  { pattern = "api.pstrack.tech/*", zone_name = "pstrack.tech" }
]

[env.development]
name = "pstrack-api-dev"

# Bindings
[[env.production.durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiter"

# Environment Variables (secrets set via `wrangler secret put`)
# DATABASE_URL, UPSTASH_REDIS_URL, etc.
```

### Pages Configuration (apps/web/wrangler.toml)

```toml
name = "pstrack-web"
compatibility_date = "2024-01-01"

[env.production]
name = "pstrack"
routes = [
  { pattern = "pstrack.tech/*", zone_name = "pstrack.tech" }
]

[env.development]
name = "pstrack-dev"
```

---

## Deployment Commands

```bash
# Deploy API to Cloudflare Workers
cd apps/api
bun run deploy

# Deploy Web to Cloudflare Pages
cd apps/web
bun run deploy

# Run locally with Wrangler
bun run dev # Uses wrangler dev under the hood
```
