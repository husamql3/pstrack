# PSTrack — Project Context & Conventions

## Project Overview

PSTrack is a competitive programming accountability platform where users join groups, solve daily problems from the NeetCode 250 roadmap, and get auto-verified against LeetCode/Codeforces APIs.

- **Stack**:
    - **Framework**: TanStack Start (SPA mode) + TanStack Router
    - **Server**: Elysia (mounted as middleware in TanStack Start)
    - **API Contract**: Eden Treaty (end-to-end type safety)
    - **Auth**: Better Auth + Polar plugin
    - **ORM**: Prisma (PostgreSQL on Neon)
    - **Validation**: TypeBox (Server) + Zod (Client)
    - **UI**: ShadCN UI + Tailwind CSS 4 + Motion
    - **Runtime**: Bun
    - **Background Jobs**: Trigger.dev

## Building and Running

### Development
- `bun dev`: Starts the development server using `portless`.
- `bun dev:app`: Starts the Vite dev server (defaults to port 3001).
- `bun dev:email`: Starts the React Email preview server.

### Database
- `bun db:migrate`: Run Prisma migrations.
- `bun db:seed`: Seed the database with core data.
- `bun db:seed-problems`: Seed the database with NeetCode problems.
- `bun db:studio`: Open Prisma Studio.

### Testing & Quality
- `bun test`: Run tests with Vitest.
- `bun typecheck`: Run TypeScript type checking.
- `bun format`: Format code using Biome.
- `bun knip`: Find unused files, dependencies, and exports.

### Production
- `bun build`: Build the application for production.

## Architecture

```
TanStack Start (Vercel)
├── client: TanStack Router SPA (src/features, src/routes)
└── server: Elysia middleware (src/server)
    ├── /api/v4/auth/*  → Better Auth
    └── /api/v4/*       → Elysia routes (Eden Treaty)
```

## Development Conventions

### API Calls
Always use the Eden Treaty client from `@/lib/api`. Never use raw `fetch()` for internal routes.
```ts
import { api } from "@/lib/api"
const { data, error } = await api.v4.users["check-username"].post({ username })
```

### Server Module Structure (`src/server/[resource]/`)
- `[resource].controller.ts`: Elysia routes.
- `[resource].model.ts`: TypeBox validation schemas.
- `[resource].dao.ts`: Prisma queries (No business logic).
- `[resource].type.ts`: Shared TypeScript types (Prisma payloads, Zod schemas).

### Feature Structure (`src/features/[feature]/`)
- `components/`: Atomic components (one concern per file).
- `hooks/`: Feature-specific hooks.
- `constants.ts`: ALL_CAPS exports (labels, keys).
- `types.ts`: UI-only types.
- `utils.ts`: Pure functions.

### Coding Rules
- **Prisma Enums**: Import from `@/generated/prisma/enums`, NEVER from `@/generated/prisma/client` (crashes in browser).
- **No `as` keyword**: Use `satisfies`, explicit return types, or find/filter patterns instead.
- **Naming**: Constants in `ALL_CAPS`, Components in `PascalCase`.
- **Atomic Components**: Split components if they handle both display and fetching, or two unrelated UI regions.
- **Hooks**: Named object returns, never tuples. Use `useMutation` for imperative actions.
- **Feedback**: Use `sileo.promise` for mutation feedback (toasts).
- **Forms**: `react-hook-form` + `zodResolver`. Schemas live in `[resource].type.ts`.

## Data Model & Business Rules

### Core Tables
- `User`: Points, streaks, pro status.
- `Group`: Public/Private, Roadmap-linked (NC250, NC150, BLIND75).
- `DailyProblem`: Assigned per group per day.
- `UserSolve`: Solve status (SOLVED, PAUSED, MISSED, etc.).
- `PointsHistory`: Audit log for all point changes.

### Business Rules
- **One Solve**: One solve per user per daily problem.
- **One Request**: One active join request per user per group.
- **Expiry**: Join requests expire after 1 day.
- **Tiers**: Free groups (30 members) / Pro groups (50 members).
- **Streak**: Breaks on `MISSED`, preserved on `VERIFICATION_FAILED`.

### Points Reference
- **Solve**: +10 (`DAILY_SOLVE`)
- **First in Group**: +5 (`FIRST_IN_GROUP`)
- **Miss**: -3 (`MISSED_DAY`)
- **Streak Bonuses**: 7d (1.2x), 30d (1.5x) - logged as `STREAK_MULTIPLIER_BONUS`.

## Trigger.dev Jobs
- `assign-daily-problem`: Midnight cron to assign problems.
- `verify-submission`: Job triggered on solve to check APIs.
- `mark-missed`: End-of-day cleanup for unsolved problems.
- `expire-join-requests`: Hourly cleanup for pending requests.
- `reset-monthly-pauses`: 1st of month cleanup.

## Primary Documentation
For more detailed context, refer to:
- `AGENTS.md`: Comprehensive app context and coding conventions (Source of Truth).
- `docs/README.md`: Links to feature specs and architectural details.
- `docs/schema.md`: Database schema and business logic details.
