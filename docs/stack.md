# Stack

## Client

### Framework & Routing

- **React 19**
- **TanStack Router**
- **TanStack Query**

### UI & Styling

- **ShadCN**
- **shadcnstudio**
- **Tailwind CSS**
- **tabler/icons-react**
- **React Email**

### State & Forms

- **Zod**
- **React Hook Form**
- **Zustand**

### Code Display

- **Diffs**

---

## Server

### Runtime & Framework

- **Bun**
- **Hono**

### Database & ORM

- **PostgreSQL**
- **Prisma**

### Caching & Real-time

- **Redis**
  - Rate limiting
  - Leaderboard caching (sorted sets)
  - Feed caching
- **Upstash Realtime**
  - In-app notifications
  - Live activity feed updates
  - Real-time leaderboard updates
  - Presence indicators (who's online)
  - Pub/sub for user events

### Background Jobs

- **Trigger.dev**
  - Daily problem verification checks
  - Streak calculations
  - Suspension automation
  - Weekly Twitter posts
  - Email batch sends

### Authentication

- **Better-Auth**

### File Storage

- **Supabase Storage** (Avatar uploads)
  - Buckets organized by group ID
  - Auto-resize with Sharp before upload
  - CDN delivery
- **Sharp**
  - Server-side image processing
  - Resize to 256x256 and 64x64
  - Convert to WebP for efficiency

### Email

- **Resend**
- **React Email**

### Validation & Type Safety

- **Zod**
- **T3-env**

### Monitoring & Analytics

- **Sentry**
- **PostHog**

### External APIs

- **LeetCode GraphQL API**
- **Codeforces API**
- **Twitter API**

---

## DevOps & Infrastructure

### Deployment

- **Docker**
- **docker-compose**
- **Dokploy**

### Hosting

- **Docker Containers**
  - Web
  - API
  - PostgreSQL
  - Redis
- **Supabase** - Storage CDN
- **Upstash** - Realtime hosting
- **Trigger.dev Cloud** - Background job hosting

### CI/CD

- **GitHub Actions** (Automated workflows)
  - Lint & Format & check-types & tests on PR
  - Build Docker images
  - Deploy via Dokploy
  - Upload source maps to Sentry

---

## Tooling & DX

- **Turborepo** - Build system and task runner
- **Oxlint** - Ultra-fast linter (Rust-based)
- **TypeScript** - Type safety across stack
- **Knip** - Unused code detection

### Git Hooks

- **Lefthook**
  - Pre-commit: lint & format staged files
  - Pre-push: run tests

### Package Management

- **Bun**

### Local Development

- **Docker Compose** - Local services (Postgres, Redis)

### AI

- <https://github.com/lobehub/lobehub/blob/main/.cursor/skills>
- <https://github.com/lobehub/lobehub/tree/main/.agents/skills>
- <https://skills.sh>

---

## Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────┐
│                        User Browser                            │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                     Dokploy Server                             │
│                  (Self-hosted Deployment)                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │           Docker Container: Web (React)              │      │
│  │    React 19 + TanStack Router + ShadCN               │      │
│  │           Nginx serving static files                 │      │
│  └────────────────────┬─────────────────────────────────┘      │
│                       │                                        │
│                       ▼                                        │
│  ┌──────────────────────────────────────────────────────┐      │
│  │        Docker Container: API (Hono on Bun)           │      │
│  ├──────────────────────────────────────────────────────┤      │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐    │      │
│  │  │ Better-Auth  │  │   Prisma     │  │  Sentry  │    │      │
│  │  │  (Sessions)  │  │     ORM      │  │ (Errors) │    │      │
│  │  └──────────────┘  └──────────────┘  └──────────┘    │      │
│  └────────┬────────────────┬────────────────┬───────────┘      │
│           │                │                │                  │
│           ▼                ▼                ▼                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Docker:    │  │   Docker:    │  │  Supabase    │          │
│  │    Redis     │  │  PostgreSQL  │  │   Storage    │          │
│  │  (Caching)   │  │  (Database)  │  │  (Avatars)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│           │                                                    │
│           ▼                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Upstash    │  │ Trigger.dev  │  │   PostHog    │          │
│  │  Realtime    │  │ (Background) │  │ (Analytics)  │          │
│  │ (WebSocket)  │  │    Jobs      │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Package Structure

```text
pstrack/
├── apps/
│   ├── web/                 # React client
│   │   ├── src/
│   │   │   ├── routes/      # TanStack Router routes
│   │   │   ├── components/  # UI components
│   │   │   ├── lib/         # Utilities
│   │   │   └── hooks/       # Custom hooks
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── api/                 # Hono API
│       ├── src/
│       │   ├── routes/      # API routes
│       │   ├── lib/         # Business logic
│       │   ├── jobs/        # Trigger.dev jobs
│       │   └── db/          # Prisma schema & migrations
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   └── shared/              # Shared types & utilities
│       ├── src/
│       │   ├── types/       # TypeScript types
│       │   └── utils/       # Shared utilities
│       └── package.json
│
├── docker-compose.yml       # Local & production services
├── turbo.json
└── package.json
```
