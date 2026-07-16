# PStrack - App Context

## What It Is

PStrack is a competitive programming accountability platform. Users join groups, solve one daily problem from the NeetCode 250 roadmap, and get auto-verified against LeetCode/Codeforces APIs. Points, streaks, and badges create the motivation loop. The tagline: **Show up. Solve. Repeat.**

## Branching

See `docs/BRANCHING.md`. `stage` is the default working branch; `main` is the stable release branch. Start feature and fix branches from `stage`, and do not push or open pull requests unless explicitly asked.

## Core Loop

1. Midnight - Trigger.dev cron assigns the next NeetCode 250 problem to all active groups
2. User clicks "Mark as Solved"
3. `verify-submission` job polls LeetCode/Codeforces for an accepted submission matching the problem + timestamp
4. If found: +10 points, streak incremented, badges evaluated
5. If neither solved nor paused by end of day: `mark-missed` job fires → -3 points, streak breaks

## User Actions Per Day

| Action | Outcome                                            |
| ------ | -------------------------------------------------- |
| Solve  | +10 pts, +5 if first in group, streak continues    |
| Pause  | Streak preserved, −5 pts, consumes 1 pause |
| Miss   | -3 pts, streak resets                              |

## Points & Gamification

- **+10** daily solve, **+5** first in group, **-3** miss
- Streak multipliers: 7d → 1.2x, 30d → 1.5x (bonus logged separately)
- Badges: Streak 7/30/100, First Solver 10/50, Consistent 30
- Leaderboard: group (all tiers) and global top 100 (Pro only), filterable by week/month/all-time

## Tiers

|                    | Free                    | Pro ($5 one-time)             |
| ------------------ | ----------------------- | ----------------------------- |
| Groups             | Join 1 (max 30 members) | Join up to 5 (max 50 members) |
| Private groups     | No                      | Yes (creator perk)            |
| Pauses/month       | 2                       | 4                             |
| Global leaderboard | No                      | Yes                           |
| Profile badge      | No                      | Yes                           |

Pro is a **lifetime one-time purchase** via Polar ($5). No subscriptions.

## Commands

Runtime is **Bun 1.3.14**. `.bun-version`, CI, `package.json`, and Docker pin the same release.

### Develop

| Command | What it does |
|---|---|
| `bun run dev` | Starts the portless proxy + Vite dev server. App is served at **https://pstrack.localhost** (not `127.0.0.1:PORT`). |
| `bun run dev:app` | Vite dev server only, bound to `127.0.0.1:${PORT:-3001}`. Use when you need a direct port. |
| `bun run dev:trigger` | Trigger.dev local dev runner (background jobs). |
| `bun run dev:email` | React Email preview server on port 3001 (`src/emails/`). |
| `bun run preview` | Vite preview of the production build. |

### Build & verify

| Command | What it does |
|---|---|
| `bun run build` | `prisma generate && vite build`. The TanStack Start build. |
| `bun run typecheck` | `prisma generate && tsc --noEmit`. Use this — never bare `tsc`, the generated Prisma client is required for types to resolve. |
| `bun run check` | Biome lint/format check (read-only). |
| `bun run format` | Biome write — applies fixes including unsafe ones. |
| `bun run knip` | Detects unused exports/files. |
| `bun run test` | Vitest, single run (no watch). |
| `bun run test -- src/path/to/file.test.ts` | Run one test file. Append `-t "name"` to filter by test name. |

### Database (Prisma → PostgreSQL)

| Command | What it does |
|---|---|
| `bun run db:generate` | Regenerate the Prisma client into `generated/prisma/`. Required after schema edits. |
| `bun run db:migrate` | `prisma migrate dev` — create + apply a dev migration. |
| `bun run db:migrate:deploy` | Apply pending migrations (CI / prod). |
| `bun run db:push` | Push schema without a migration (prototype use only). |
| `bun run db:seed` | Run the master seed (`prisma/seed.ts`). Also `db:seed-problems`, `db:seed-groups`, `db:seed-daily-problems` for targeted seeds. |
| `bun run db:reset` | `prisma migrate reset` — drops, re-migrates, re-seeds. Destructive; confirm before running. |
| `bun run db:studio` | Opens Prisma Studio against `.env`. |

### Env sync

| Command | What it does |
|---|---|
| `bun run env:sync:prod` | Sync `.env.prod` to the Coolify production app. |
| `bun run env:sync:stage:dry-run` | Preview the allowlisted `.env.stage` → Vercel staging sync. |
| `bun run env:sync:stage` | Sync the allowlisted `.env.stage` to Vercel staging. |
| `bun run env:sync:trigger` | Sync env vars to Trigger.dev. |
| `bun run env:sync:gh` | Sync env vars to GitHub Actions secrets. |

### Trigger.dev deploys

`bun run deploy:trigger-prod` deploys background jobs to Trigger.dev production. `bun run dev:trigger` is the local equivalent.

## Groups

- **Public** - request to join, admin approves/rejects within 1 day (auto-expires)
- **Private** - invite link only (7/30/90 day or permanent expiry), instant join
- Admin actions: approve/reject requests, remove members, update group, manage invite links
- Points and streaks belong to the user, not the group - leaving a group doesn't lose progress

## Stack

| Layer           | Technology                                          |
| --------------- | --------------------------------------------------- |
| Framework       | TanStack Start (SPA, no SSR) + TanStack Router      |
| Server          | Elysia (mounted inside TanStack Start middleware)   |
| API contract    | Eden Treaty (end-to-end type safety, no codegen)    |
| Auth + Payments | Better Auth + Polar plugin                          |
| ORM             | Prisma → PostgreSQL (Coolify prod; Neon staging)    |
| Validation      | TypeBox (server) + Zod (client forms)               |
| UI              | ShadCN + Tailwind + Motion                          |
| Background jobs | Trigger.dev                                         |
| Email           | React Email + Stalwart SMTP (Resend rollback path)  |
| Error tracking  | Sentry                                              |
| Avatars         | hashvatar (deterministic from username, no uploads) |
| Runtime         | Bun                                                 |
| Deployment      | Coolify production; Vercel isolated staging        |

## Architecture

```
TanStack Start (Coolify production / Vercel staging)
├── client: TanStack Router SPA
└── server: Elysia middleware
    ├── /api/v3/auth/*  → Better Auth (+ Polar plugin)
    └── /api/v3/*       → Elysia routes (Eden Treaty contract)
```

TanStack Start's `api.$.ts` catch-all route forwards every `/api/*` request to the Elysia app - one deployment unit, full type safety between client and server via Eden Treaty without codegen.

## Repo Layout

```
pstrack/
├── src/
│   ├── components/          # Shared UI (shadcn primitives + app-level shells)
│   ├── emails/              # React Email templates (transport-independent)
│   ├── features/            # Feature modules (components + hooks per domain)
│   ├── hooks/               # Global custom hooks
│   ├── lib/                 # Client-side utilities, API client, query client
│   ├── routes/              # TanStack Router file-based routes
│   ├── server/              # Elysia controllers, DAOs, models, types
│   │   ├── badges/
│   │   ├── groups/
│   │   ├── points/
│   │   ├── problems/
│   │   ├── users/
│   │   ├── jobs/            # Trigger.dev task definitions
│   │   ├── lib/             # auth, db, email, sentry, session
│   │   └── modules/         # health check, OpenAPI docs
│   └── env.ts               # T3 env validation schema
├── prisma/
│   ├── schema.prisma
│   └── data/                # Seed data (NeetCode 250 problems)
├── generated/
│   └── prisma/              # Prisma generated client + enums
└── docs/                    # Supplementary specs (POINTS, SCHEMA, ROUTES, DECISIONS, FLOWS, …)
```

## Key Data Model

- **User** - central entity. Denormalized `totalPoints` and `currentStreak` for fast leaderboard reads. `isPro` is set automatically when `totalPoints >= 3,000` or when a Polar purchase webhook fires; `proSource` records which path unlocked it.
- **Group** - `PUBLIC` groups use join requests; `PRIVATE` groups use invite links. `slug` is human-readable and URL-safe. A group sits in one roadmap (`NC250 | NC150 | BLIND75`).
- **DailyProblem** - one row per group per calendar day (unique on `groupId + assignedDate`). Tracks `firstSolverId` to award the first-in-group bonus exactly once.
- **UserSolve** - one row per user per daily problem (unique on `userId + dailyProblemId`). The `status` field is a terminal state machine: `PENDING_VERIFICATION → SOLVED | VERIFICATION_FAILED`, or `PAUSED | MISSED`. Streaks break only on `MISSED`, never on `VERIFICATION_FAILED` (grace window for flaky LC/CF API responses).
- **PointsHistory** - immutable append-only ledger. Every point change (positive or negative) writes a row. `User.totalPoints` is a denormalized cache of this ledger's sum.
- **UserBadge** - unique constraint on `userId + type` prevents duplicate badge awards.

## Auth

**Better Auth** owns sessions. Three sign-in methods: Google OAuth, GitHub OAuth, Magic Link.

Extract the session on every protected route - `requireSessionUser` never throws, it returns a 401 response object on failure that the controller returns directly:

```ts
const { user, response } = await requireSessionUser(request)
if (!user) return response   // { status: 401, body: { error: "Unauthorized" } }
```

`getSessionUser` is the nullable variant for endpoints that are public but show different data when signed in.

**Admin access** is role-gated at the controller level:

```ts
const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } })
if (dbUser?.role !== "admin") return error(403, { error: "Admin access required" })
```

**Polar integration** is a Better Auth plugin. When a Polar webhook fires for a completed purchase, Better Auth sets `isPro = true` and `proSource = POLAR_PURCHASE` on the user record automatically.

## Trigger.dev Jobs

| Task | Schedule | What it does |
|---|---|---|
| `assign-daily-problem` | `0 0 * * *` | Picks the next NeetCode 250 problem per group's roadmap position; creates `DailyProblem` rows; sends daily digest emails |
| `verify-submission` | On solve | Polls LeetCode/Codeforces for an accepted submission matching the problem + timestamp; awards points/bonuses, updates streak, evaluates badges |
| `mark-missed` | `0 0 * * *` | For every `UserSolve` from yesterday without a terminal status: sets `MISSED`, applies −3, breaks streak, and claws back same-day/streak bonuses |
| `expire-join-requests` | Every hour | Marks `GroupJoinRequest` rows older than 1 day with status `PENDING` as `EXPIRED` |
| `reset-monthly-pauses` | `0 0 1 * *` | Resets `User.pausesUsedThisMonth = 0` |
| `reset-monthly-counters` | `0 0 1 * *` | Resets `User.verificationFailuresThisMonth = 0` |
| `send-hourly-digest` | `0 * * * *` | Fires `digest.hourly` to the admin bot with last-hour activity + stale-job health (bot enriches with the hour's error count and skips empty hours) |

`mark-missed` and `assign-daily-problem` both run at midnight UTC. The assign job runs first (sorted by `scheduleId`); `mark-missed` operates on the previous day's rows so there is no ordering conflict.

See `docs/FLOWS.md` for the full Daily Solve lifecycle, and `docs/POINTS.md` for clawback mechanics.

## Email Notifications

Transactional emails use **React Email** templates from `src/emails/`. Private
Stalwart SMTP is the production target tracked by #289, staging is log-only,
and the Resend transport remains until its retirement gate is proven.
See `docs/OPERATIONS.md` for environment boundaries and runbooks.

Notification triggers are co-located with the resource that owns the event:
- `src/server/groups/groups.notifications.ts` - join request, approval, rejection, expiry, removal
- `src/server/problems/problems.notifications.ts` - daily digest, solve verified, verification failed, streak milestone, badge earned

All notification calls are **fire-and-forget** - never `await`ed in request handlers:

```ts
groupNotifications.joinRequested(groupId, userId).catch(() => {})
```

This prevents email delivery failures from blocking the user's request. Users can opt out per category from `/settings/notifications`.

## Admin Bot (husam-bot)

Operator-facing telemetry goes to the external **husam-bot** Telegram service via `notifyAdmin(event, payload)` in `src/server/lib/bot.ts` (POSTs `{event, payload}` to `${BOT_URL}/api/notify` with a bearer secret; no-op when `BOT_URL` is unset). The bot validates every event against a Zod discriminated union — **there is no generic fallback, so a new event must be registered on the bot side too**, or it 400s. Contract lives in husam-bot `docs/adr/0002` + `0003`.

Events fired today: `user.created`, `purchase.pro`, `purchase.pro.refunded`, `feedback.submitted`, `join.requested`, `pro.expired`, `points.reconciliation_drift`, `points.reconciliation_failed`, `digest.daily`, `digest.hourly`, `digest.weekly`, `streak.milestone`, `badge.earned`, `error.captured`, and `system.event` (a curated subset of `SystemEventType` — see AgDR-0001 in `system-events.dao.ts`).

**Error tee (`error.captured`):** `captureServerException` mirrors every server-side capture to the bot in **production only**, fire-and-forget, with a redacted payload (type, truncated message, culprit frame, route, `userId`, fingerprint). The bot bounds volume with Redis-backed dedup + per-hour rate limiting, so an error storm can't flood the channel. Client/browser errors are **not** teed — they stay in Sentry.io.

## Routes Summary

**Public:** `/`, `/login`, `/signup`, `/profile/$username`
**Authenticated:** `/onboarding`, `/dashboard`, `/problems`, `/leaderboard`, `/leaderboard/$groupId`, `/groups`, `/groups/new`, `/groups/$groupId` (+ /settings, /members, /join-requests), `/settings/*`
**Admin:** `/admin`, `/admin/users`, `/admin/groups`, `/admin/problems`

## Build Phases (10 total)

1. Project setup & tooling
2. Auth (Better Auth, Google/GitHub/magic-link, onboarding)
3. Groups (create, join, manage, invite links)
4. Daily problem system (assign, solve, verify, pause, miss)
5. Points, streaks & badges
6. Leaderboard (group + global)
7. Freemium - Polar integration
8. User profiles & settings
9. Admin dashboard
10. Polish & beta launch (50 users)

## Post-MVP Backlog

- Solutions sharing (submit, view, upvote)
- Activity feed (group-scoped, poll-based)
- Resources hub
- In-app notification inbox (Upstash Realtime + WebSocket)
- Redis leaderboard cache (self-hosted Redis, ADR 0011)
- PostHog analytics
- Custom roadmaps (Pro admin perk)
- Mobile app

---

## Coding Conventions

### API Calls

Always use the Eden Treaty client from `@/lib/api` - never raw `fetch()` for internal API routes:

```ts
import { api } from "@/lib/api"

const { data, error } = await api.v3.users["check-username"].post({ username })
```

### Server Module Structure

Each resource lives in `src/server/[resource]/` with four files:

| File | Purpose |
|------|---------|
| `[resource].controller.ts` | Elysia routes |
| `[resource].model.ts` | TypeBox validation schemas |
| `[resource].dao.ts` | Prisma queries only - no business logic |
| `[resource].type.ts` | Shared TypeScript types imported by both server and client |

No barrel `index.ts` - import from the specific file to prevent client bundles from pulling in server-only code.

Register the controller in `src/server/app.ts`:
```ts
import { myResourceController } from "@/server/my-resource/my-resource.controller"
const api = new Elysia({ prefix: "/api/v3" }).use(myResourceController)
```

**Model files** use TypeBox (`t` from elysia):
```ts
import Elysia, { t } from "elysia"

export const usersModel = new Elysia({ name: "model/users" }).model({
  "users.checkUsername": t.Object({ username: t.String({ minLength: 1 }) }),
})
```

**DAO files** contain only Prisma queries:
```ts
import { db } from "@/server/lib/db"

export const usersDao = {
  findByUsername: async (username: string) =>
    db.user.findUnique({ where: { username }, select: { id: true } }),
}
```

### Types

**Naming**:
- Constants array: `ALL_CAPS` → `FEATURE_CARDS`
- Response types: `[Entity]Response` → always `Prisma.XGetPayload<{ select: {...} }>`, never a manual interface
- DAO input types: `[Entity]Input` → always derived from `Prisma.XUncheckedCreateInput`

**Shared Types (Server → Client)**

Response shape types are defined **once** in `src/server/[resource]/[resource].type.ts` and imported by both the DAO and the frontend hook. Never re-declare them on the client side:

```ts
// src/server/users/users.type.ts
const userSelect = { id: true, username: true, points: true } satisfies Prisma.UserSelect
export type UserResponse = Prisma.UserGetPayload<{ select: typeof userSelect }>

// src/features/dashboard/hooks/use-user.ts
import type { UserResponse } from "@/server/users/users.type"
```

Use `satisfies Prisma.XSelect` (not `as const`) for select objects - it validates the shape against Prisma's generated type while preserving the inferred literal types.

When a payload type is referenced more than once inside a type file, alias it locally to avoid repetition:

```ts
type DailyProblemRow = Prisma.DailyProblemGetPayload<{ select: typeof dailyProblemSelect }>
// then use DailyProblemRow["solves"][number] instead of the full generic twice
```

Add explicit `Promise<ReturnType>` annotations to DAO methods whose return type is a discriminated union - this enables TypeScript contextual typing so state discriminants like `state: "NO_GROUP"` are narrowed automatically without `as const`.

Derive enum key types from Prisma instead of writing string unions by hand:

```ts
// ✅
import { Roadmap } from "@/generated/prisma/enums"
export type RoadmapKey = Roadmap   // "NC250" | "NC150" | "BLIND75"

// ❌ never
export type RoadmapKey = "NC250" | "NC150" | "BLIND75"
```

### Prisma Enums

**Import from `@/generated/prisma/enums`, never from `@/generated/prisma/client`** for any value import. The `client` file uses Node.js APIs (`node:url`, `node:path`) and will crash in the browser. `import type { Prisma }` from `client` is safe - type-only imports are erased at compile time.

```ts
// ✅
import { SolveStatus, Roadmap, Difficulty } from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"

// ❌ never (pulls Node.js runtime into browser bundle)
import { SolveStatus } from "@/generated/prisma/client"
```

**Use enum values in comparisons, never string literals:**

```ts
// ✅
if (solve.status === SolveStatus.SOLVED) { ... }

// ❌
if (solve.status === "SOLVED") { ... }
```

**No `as` keyword** - use alternatives instead:

| Instead of | Use |
|-----------|-----|
| `roadmap as RoadmapKey` | Remove the cast - Prisma types `group.roadmap` as `Roadmap` already |
| `["NC250"] as const` inline | `const ROADMAP_KEYS: RoadmapKey[] = [Roadmap.NC250, ...]` |
| `v as RoadmapKey` in event handlers | `ROADMAP_KEYS.find(r => r === v)` returns `RoadmapKey \| undefined` |
| `"READY" as const` in return | Add explicit `Promise<ReturnType>` - contextual typing handles it |
| `obj as const` on select objects | `satisfies Prisma.XSelect` |

**Zod schemas** - use the object form, never a duplicated string array:

```ts
// ✅
z.enum(Roadmap)                                    // roadmap param
z.union([z.literal("all"), z.enum(Difficulty)])    // filter with "all" sentinel

// ❌
z.enum(["NC250", "NC150", "BLIND75"])
```

**TypeBox/Elysia models** - same principle:

```ts
// ✅
import { Roadmap } from "@/generated/prisma/enums"
t.Optional(t.Enum(Roadmap))

// ❌
t.Union([t.Literal("NC250"), t.Literal("NC150"), t.Literal("BLIND75")])
```

### Feature Structure

Features live in `src/features/[feature]/`:

```
src/features/[feature]/
  components/       ← one file per component, PascalCase filename; each does ONE job
  hooks/            ← feature-specific hooks
  constants.ts      ← ALL_CAPS exports (labels, keys, tone maps, filter arrays)
  types.ts          ← UI-only types (not shared with server, e.g. DifficultyFilter)
  utils.ts          ← pure functions (e.g. groupByTopic)
```

**Atomic components** - every component renders exactly one concern. Split when a component handles display AND data fetching, or renders two unrelated UI regions. Examples of atomic splits for a problems page:

| Component | Single responsibility |
|-----------|----------------------|
| `ProgressDisplay` | Solved/total counter + bar |
| `RoadmapTabs` | Tab switcher for roadmap keys |
| `FilterRow` | Search input + difficulty + status filters |
| `ProblemRow` | One problem list item |
| `TopicGroup` | One accordion section |
| `ProblemList` | Skeleton / empty / accordion orchestration |

The **route file** is the orchestrator: reads search params, owns `useMemo` derived state, wires `useCallback` handlers, and composes components. No rendering logic lives there.

**Handlers passed to child components must be `useCallback`-wrapped** to prevent the child's `useEffect` from re-firing on every parent render:

```ts
const handleRoadmapChange = useCallback(
  (roadmap: RoadmapKey) => navigate({ search: (prev) => ({ ...prev, roadmap }) }),
  [navigate]
)
```

For callbacks inside child components that close over a prop callback (e.g. `onQueryChange`), use a ref to avoid stale closure without adding the callback to effect deps:

```ts
const onQueryChangeRef = useRef(onQueryChange)
useEffect(() => { onQueryChangeRef.current = onQueryChange })

useEffect(() => {
  if (!didMount.current) { didMount.current = true; return }
  onQueryChangeRef.current(debouncedQ)
}, [debouncedQ]) // ← intentionally omits onQueryChange
```

### React Hooks

Location: `src/hooks/` for global hooks, `src/features/[feature]/hooks/` for feature hooks.

**Pattern** - named object return, never a tuple:
```ts
export const useUsers = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await api.v3.users.get()
      if (error) throw new Error("Failed to fetch users")
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
  return { users: data ?? [], isLoading }
}
```

Use `useMutation` for imperative operations (form saves, async validations on blur):
```ts
export const useCheckUsername = () =>
  useMutation({
    mutationFn: async (username: string) => {
      const { data, error } = await api.v3.users["check-username"].post({ username })
      if (error) throw new Error("Could not verify username")
      return data.available
    },
  })
```

### Mutation Toast Feedback

Use `sileo.promise` - never call `sileo.success` / `sileo.error` manually around mutations. The component owns the toast text; hooks stay pure:

```ts
await sileo.promise(
  saveMutation.mutateAsync(data),
  {
    loading: { title: "Saving..." },
    success: { title: "Saved!" },
    error: (err: Error) => ({ title: "Failed to save", description: err.message }),
  },
)
```

### Components

**Export**: named export, PascalCase, same name as file:
```ts
// File: welcome-step.tsx
export const WelcomeStep = ({ onContinue }: { onContinue: () => void }) => { ... }
```

**Props**: destructure inline - no separate `Props` interface:
```ts
export const MyComponent = ({ id, label }: { id: string; label: string }) => { ... }
```

**React imports**: only import what you use - never `import type * as React from "react"`:
```ts
import { useState, useCallback } from "react"
import type { ReactNode } from "react"
```

**Imports order** (enforced by Biome):
1. External packages
2. Local `@/` aliases

**className composition**: always via `cn()` from `@/lib/utils`.

### Forms

All forms use **react-hook-form** with **zodResolver**. Define the Zod schema in `src/server/[resource]/[resource].type.ts` alongside the shared types:

```ts
// src/server/rooms/rooms.type.ts
import { z } from "zod"
export const createRoomSchema = z.object({
  name: z.string({ error: "Name is required" }).min(1, "Name is required"),
})
export type CreateRoomFormInput = z.infer<typeof createRoomSchema>
```

**Rules**:
- Schema lives in `[resource].type.ts`, never inline in the component
- Use `register()` for native `<input>` / `<textarea>`; use `<Controller>` for Radix/custom components
- `disabled={isPending}` on all inputs and the submit button during mutation
- **Zod v3 error messages**: use `{ error: "..." }` - never the v3 `{ message }`, `{ required_error }`, or `{ invalid_type_error }` forms
