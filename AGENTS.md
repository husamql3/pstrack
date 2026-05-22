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

| Action | Outcome |
|---|---|
| Solve | +10 pts, +5 if first in group, streak continues |
| Pause | Streak preserved, no points lost, consumes 1 pause |
| Miss | -3 pts, streak resets |

## Points & Gamification

- **+10** daily solve, **+5** first in group, **-3** miss
- Streak multipliers: 7d → 1.2x, 30d → 1.5x (bonus logged separately)
- Badges: Streak 7/30/100, First Solver 10/50, Consistent 30
- Leaderboard: group (all tiers) and global top 100 (Pro only), filterable by week/month/all-time

## Tiers

| | Free | Pro ($14 one-time) |
|---|---|---|
| Groups | Join 1 (max 30 members) | Join up to 5 (max 50 members) |
| Private groups | No | Yes (creator perk) |
| Pauses/month | 2 | 4 |
| Global leaderboard | No | Yes |
| Profile badge | No | Yes |

Pro is a **lifetime one-time purchase** via Polar ($14 standard, $9 sale). No subscriptions.

## Groups

- **Public** — request to join, admin approves/rejects within 1 day (auto-expires)
- **Private** — invite link only (7/30/90 day or permanent expiry), instant join
- Admin actions: approve/reject requests, remove members, update group, manage invite links
- Points and streaks belong to the user, not the group — leaving a group doesn't lose progress

## Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (SPA, no SSR) + TanStack Router |
| Server | Elysia (mounted inside TanStack Start middleware) |
| API contract | Eden Treaty (end-to-end type safety, no codegen) |
| Auth + Payments | Better Auth + Polar plugin |
| ORM | Prisma → Neon (PostgreSQL) |
| Validation | TypeBox (server) + Zod (client forms) |
| UI | ShadCN + Tailwind + Motion |
| Background jobs | Trigger.dev |
| Email | Resend + React Email |
| Error tracking | Sentry |
| Avatars | hashvatar (deterministic from username, no uploads) |
| Runtime | Bun |
| Deployment | Vercel |

## Architecture

```
TanStack Start (Vercel)
├── client: TanStack Router SPA
└── server: Elysia middleware
    ├── /api/auth/*  → Better Auth (+ Polar plugin)
    └── /api/*       → Elysia routes (Eden Treaty contract)
```

## Key Data Model

- `User` — points (denormalized), streak, isPro, pausesUsedThisMonth, notification prefs
- `Group` — public/private, maxMembers, optional inviteCode
- `DailyProblem` — one problem per group per day (unique constraint)
- `UserSolve` — single source of truth per user per day: `PENDING_VERIFICATION | SOLVED | PAUSED | MISSED | VERIFICATION_FAILED`
- `PointsHistory` — immutable audit log of every point change
- Streaks break on `MISSED`, not `VERIFICATION_FAILED` (grace window)

## Trigger.dev Jobs

| Job | Schedule | Purpose |
|---|---|---|
| `assign-daily-problem` | Midnight | Assigns next NeetCode 250 problem to all active groups |
| `verify-submission` | On solve | Polls LC/CF API, awards points, updates streak |
| `mark-missed` | End of day | Sets unresolved UserSolves to MISSED, applies -3 pts |
| `expire-join-requests` | Hourly | Marks PENDING requests > 1 day as EXPIRED |
| `reset-monthly-pauses` | 1st of month | Resets `pausesUsedThisMonth` to 0 |

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
