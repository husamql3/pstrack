# PSTrack — App Context

## What It Is

PSTrack is a competitive programming accountability platform. Users join groups, solve one daily problem from the NeetCode 250 roadmap, and get auto-verified against LeetCode/Codeforces APIs. Points, streaks, and badges create the motivation loop. The tagline: **Show up. Solve. Repeat.**

## Core Loop

1. Midnight — Trigger.dev cron assigns the next NeetCode 250 problem to all active groups
2. User clicks "Mark as Solved"
3. `verify-submission` job polls LeetCode/Codeforces for an accepted submission matching the problem + timestamp
4. If found: +10 points, streak incremented, badges evaluated
5. If neither solved nor paused by end of day: `mark-missed` job fires → -3 points, streak breaks

## User Actions Per Day

| Action | Outcome                                            |
| ------ | -------------------------------------------------- |
| Solve  | +10 pts, +5 if first in group, streak continues    |
| Pause  | Streak preserved, no points lost, consumes 1 pause |
| Miss   | -3 pts, streak resets                              |

## Points & Gamification

- **+10** daily solve, **+5** first in group, **-3** miss
- Streak multipliers: 7d → 1.2x, 30d → 1.5x (bonus logged separately)
- Badges: Streak 7/30/100, First Solver 10/50, Consistent 30
- Leaderboard: group (all tiers) and global top 100 (Pro only), filterable by week/month/all-time

## Tiers

|                    | Free                    | Pro ($14 one-time)            |
| ------------------ | ----------------------- | ----------------------------- |
| Groups             | Join 1 (max 30 members) | Join up to 5 (max 50 members) |
| Private groups     | No                      | Yes (creator perk)            |
| Pauses/month       | 2                       | 4                             |
| Global leaderboard | No                      | Yes                           |
| Profile badge      | No                      | Yes                           |

Pro is a **lifetime one-time purchase** via Polar ($14 standard, $9 sale). No subscriptions.

## Groups

- **Public** — request to join, admin approves/rejects within 1 day (auto-expires)
- **Private** — invite link only (7/30/90 day or permanent expiry), instant join
- Admin actions: approve/reject requests, remove members, update group, manage invite links
- Points and streaks belong to the user, not the group — leaving a group doesn't lose progress

## Stack

| Layer           | Technology                                          |
| --------------- | --------------------------------------------------- |
| Framework       | TanStack Start (SPA, no SSR) + TanStack Router      |
| Server          | Elysia (mounted inside TanStack Start middleware)   |
| API contract    | Eden Treaty (end-to-end type safety, no codegen)    |
| Auth + Payments | Better Auth + Polar plugin                          |
| ORM             | Prisma → Neon (PostgreSQL)                          |
| Validation      | TypeBox (server) + Zod (client forms)               |
| UI              | ShadCN + Tailwind + Motion                          |
| Background jobs | Trigger.dev                                         |
| Email           | Resend + React Email                                |
| Error tracking  | Sentry                                              |
| Avatars         | hashvatar (deterministic from username, no uploads) |
| Runtime         | Bun                                                 |
| Deployment      | Vercel                                              |

## Architecture

```
TanStack Start (Vercel)
├── client: TanStack Router SPA
└── server: Elysia middleware
    ├── /api/v4/auth/*  → Better Auth (+ Polar plugin)
    └── /api/v4/*       → Elysia routes (Eden Treaty contract)
```

## Key Data Model

- `User` — points (denormalized), streak, isPro, pausesUsedThisMonth, notification prefs
- `Group` — public/private, maxMembers, optional inviteCode
- `DailyProblem` — one problem per group per day (unique constraint)
- `UserSolve` — single source of truth per user per day: `PENDING_VERIFICATION | SOLVED | PAUSED | MISSED | VERIFICATION_FAILED`
- `PointsHistory` — immutable audit log of every point change
- Streaks break on `MISSED`, not `VERIFICATION_FAILED` (grace window)

## Trigger.dev Jobs

| Job                    | Schedule     | Purpose                                                |
| ---------------------- | ------------ | ------------------------------------------------------ |
| `assign-daily-problem` | Midnight     | Assigns next NeetCode 250 problem to all active groups |
| `verify-submission`    | On solve     | Polls LC/CF API, awards points, updates streak         |
| `mark-missed`          | End of day   | Sets unresolved UserSolves to MISSED, applies -3 pts   |
| `expire-join-requests` | Hourly       | Marks PENDING requests > 1 day as EXPIRED              |
| `reset-monthly-pauses` | 1st of month | Resets `pausesUsedThisMonth` to 0                      |

## Email Notifications (Resend)

Auth: welcome, magic-link, security-alert
Groups: join-request (to admin), join-approved/rejected/expired (to user), removed-from-group
Daily: daily-problem digest, solve-verified, verification-failed
Achievements: streak-milestone, badge-earned
Users can opt out per category from `/settings/notifications`.

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
7. Freemium — Polar integration
8. User profiles & settings
9. Admin dashboard
10. Polish & beta launch (50 users)

## Post-MVP Backlog

- Solutions sharing (submit, view, upvote)
- Activity feed (group-scoped, poll-based)
- Resources hub
- In-app notification inbox (Upstash Realtime + WebSocket)
- Redis leaderboard cache (Upstash)
- PostHog analytics
- Custom roadmaps (Pro admin perk)
- Mobile app

---

## Coding Conventions

### API Calls

Always use the Eden Treaty client from `@/lib/api` — never raw `fetch()` for internal API routes:

```ts
import { api } from "@/lib/api"

const { data, error } = await api.v4.users["check-username"].post({ username })
```

### Server Module Structure

Each resource lives in `src/server/[resource]/` with four files:

| File | Purpose |
|------|---------|
| `[resource].controller.ts` | Elysia routes |
| `[resource].model.ts` | TypeBox validation schemas |
| `[resource].dao.ts` | Prisma queries only — no business logic |
| `[resource].type.ts` | Shared TypeScript types imported by both server and client |

No barrel `index.ts` — import from the specific file to prevent client bundles from pulling in server-only code.

Register the controller in `src/server/app.ts`:
```ts
import { myResourceController } from "@/server/my-resource/my-resource.controller"
const api = new Elysia({ prefix: "/api/v4" }).use(myResourceController)
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

Use `satisfies Prisma.XSelect` (not `as const`) for select objects — it validates the shape against Prisma's generated type while preserving the inferred literal types.

When a payload type is referenced more than once inside a type file, alias it locally to avoid repetition:

```ts
type DailyProblemRow = Prisma.DailyProblemGetPayload<{ select: typeof dailyProblemSelect }>
// then use DailyProblemRow["solves"][number] instead of the full generic twice
```

Add explicit `Promise<ReturnType>` annotations to DAO methods whose return type is a discriminated union — this enables TypeScript contextual typing so state discriminants like `state: "NO_GROUP"` are narrowed automatically without `as const`.

Derive enum key types from Prisma instead of writing string unions by hand:

```ts
// ✅
import { Roadmap } from "@/generated/prisma/enums"
export type RoadmapKey = Roadmap   // "NC250" | "NC150" | "BLIND75"

// ❌ never
export type RoadmapKey = "NC250" | "NC150" | "BLIND75"
```

### Prisma Enums

**Import from `@/generated/prisma/enums`, never from `@/generated/prisma/client`** for any value import. The `client` file uses Node.js APIs (`node:url`, `node:path`) and will crash in the browser. `import type { Prisma }` from `client` is safe — type-only imports are erased at compile time.

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

**No `as` keyword** — use alternatives instead:

| Instead of | Use |
|-----------|-----|
| `roadmap as RoadmapKey` | Remove the cast — Prisma types `group.roadmap` as `Roadmap` already |
| `["NC250"] as const` inline | `const ROADMAP_KEYS: RoadmapKey[] = [Roadmap.NC250, ...]` |
| `v as RoadmapKey` in event handlers | `ROADMAP_KEYS.find(r => r === v)` returns `RoadmapKey \| undefined` |
| `"READY" as const` in return | Add explicit `Promise<ReturnType>` — contextual typing handles it |
| `obj as const` on select objects | `satisfies Prisma.XSelect` |

**Zod schemas** — use the object form, never a duplicated string array:

```ts
// ✅
z.enum(Roadmap)                                    // roadmap param
z.union([z.literal("all"), z.enum(Difficulty)])    // filter with "all" sentinel

// ❌
z.enum(["NC250", "NC150", "BLIND75"])
```

**TypeBox/Elysia models** — same principle:

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

**Atomic components** — every component renders exactly one concern. Split when a component handles display AND data fetching, or renders two unrelated UI regions. Examples of atomic splits for a problems page:

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

**Pattern** — named object return, never a tuple:
```ts
export const useUsers = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await api.v4.users.get()
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
      const { data, error } = await api.v4.users["check-username"].post({ username })
      if (error) throw new Error("Could not verify username")
      return data.available
    },
  })
```

### Mutation Toast Feedback

Use `sileo.promise` — never call `sileo.success` / `sileo.error` manually around mutations. The component owns the toast text; hooks stay pure:

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

**Props**: destructure inline — no separate `Props` interface:
```ts
export const MyComponent = ({ id, label }: { id: string; label: string }) => { ... }
```

**React imports**: only import what you use — never `import type * as React from "react"`:
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
- **Zod v4 error messages**: use `{ error: "..." }` — never the v3 `{ message }`, `{ required_error }`, or `{ invalid_type_error }` forms
