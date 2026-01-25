# Stack

## Client

### Framework & Routing

- **React 19**
- **TanStack Start**
- **TanStack Router**
- **TanStack Query**

### UI & Styling

- **ShadCN** - Component library (based on BaseUI)
- **shadcnstudio**
- **Tailwind CSS** - Utility-first styling
- **tabler/icons-react** - Icon library
- **React Email** - Email template components

### State & Forms

- **Zod** - Schema validation
- **React Hook Form** - Form management
- **Zustand** - Lightweight state management (for global UI state)

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

### Caching & Jobs

- **Upstash Redis** - Managed Redis for:
  - Session storage
  - Rate limiting
  - Leaderboard caching (sorted sets)
  - Feed caching
- **Trigger.dev** - Background jobs & workflows:
  - Daily problem verification checks
  - Streak calculations
  - Suspension automation
  - Weekly Twitter posts
  - Email batch sends

### Authentication

- **Better-Auth** - Modern auth library
  - Email/password
  - Magic links
  - Session management
  - CSRF protection

### File Storage

- **Supabase Storage** - Avatar uploads
  - Buckets organized by group ID
  - Auto-resize with Sharp before upload
  - CDN delivery
- **Sharp** - Server-side image processing
  - Resize to 256x256 and 64x64
  - Convert to WebP for efficiency

### Email

- **Resend** - Transactional email service
- **React Email** - Type-safe email templates

### Validation & Type Safety

- **Zod**
- **T3-env**

### Monitoring & Analytics

- **Sentry** -
- **PostHog** - Product analytics:
  - Feature usage tracking
  - User funnels
  - A/B testing
  - Session replays

### External APIs

- **LeetCode GraphQL API** - Submission verification
- **Codeforces API** - Submission verification
- **Twitter API** - Automated leaderboard posts

---

## DevOps & Infrastructure

### Deployment

- **Dokploy** - Self-hosted PaaS on VPS
  - Container orchestration
  - Zero-downtime deployments
  - Built-in monitoring
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

### Hosting

- **VPS** (DigitalOcean/Hetzner) - Application server
- **Cloudflare** - DNS, CDN, DDoS protection
- **Supabase** - Storage hosting

### CI/CD

- **GitHub Actions** - Automated workflows:
  - Lint & type-check on PR
  - Run tests
  - Build Docker images
  - Deploy to Dokploy via SSH

---

## Tooling & DX

### Monorepo Management

- **Turborepo**

### Code Quality

- **Oxlint** - Ultra-fast linter (Rust-based)
- **TypeScript** - Type safety across stack

### Git Hooks

- **Lefthook** - Fast git hooks manager
  - Pre-commit: lint staged files
  - Pre-push: run tests

### Package Management

- **Bun**

---

## Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                        |
│  (React + TanStack Router + TanStack Query + ShadCN)        │
│                  Deployed via Dokploy                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                       Cloudflare CDN                        │
│                    (DNS, DDoS Protection)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Hono)                       │
│                    Running on Bun Runtime                   │
│                     Deployed via Dokploy                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Better-Auth  │  │   Drizzle    │  │  Trigger.dev │       │
│  │  (Sessions)  │  │     ORM      │  │ (Background) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└───────┬──────────────────┬──────────────────┬───────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Upstash    │  │  Supabase    │  │  Supabase    │
│    Redis     │  │  PostgreSQL  │  │   Storage    │
│  (Caching)   │  │  (Database)  │  │  (Avatars)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://... # For migrations

# Redis
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

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
POSTHOG_API_KEY=
POSTHOG_PROJECT_ID=

# Background Jobs
TRIGGER_API_KEY=
TRIGGER_API_URL=

# Cloudflare
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
```

---

## Package Structure

```
pstrack-v3/
├── apps/
│   ├── web/                 # React client
│   │   ├── src/
│   │   │   ├── routes/      # TanStack Router routes
│   │   │   ├── components/  # UI components
│   │   │   ├── lib/         # Utilities
│   │   │   └── hooks/       # Custom hooks
│   │   └── package.json
│   │
│   └── api/                 # Hono API
│       ├── src/
│       │   ├── routes/      # API routes
│       │   ├── lib/         # Business logic
│       │   ├── jobs/        # Trigger.dev jobs
│       │   └── db/          # Drizzle schema & migrations
│       └── package.json
│
├── packages/
│   ├── ui/                  # Shared ShadCN components
│   ├── db/                  # Drizzle schema (shared)
│   ├── validation/          # Zod schemas (shared)
│   └── tsconfig/            # Shared TS configs
│
├── tooling/
│   ├── eslint/
│   └── typescript/
│
├── docker-compose.yml
├── turbo.json
└── package.json
```
