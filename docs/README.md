# PSTrack v3

A competitive programming accountability platform. Users join groups, solve one daily problem from the NeetCode 250 roadmap, get auto-verified against LeetCode/Codeforces APIs, and earn points to maintain streaks.

## Core Loop

1. Daily problem from NeetCode 250 assigned to all groups at midnight
2. User marks problem as solved
3. Trigger.dev job verifies submission against LeetCode or Codeforces API
4. Points awarded, streak updated

## Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (SPA, no SSR) |
| Routing | TanStack Router |
| Server | Elysia (mounted inside TanStack Start) |
| API Contract | Eden Treaty (end-to-end type safety) |
| Auth + Payments | Better Auth + Polar plugin |
| ORM | Prisma |
| Database | Neon (PostgreSQL) |
| Validation | TypeBox (server) + Zod (client forms) |
| Runtime | Bun |
| Deployment | Vercel |
| Email | Resend |
| Background Jobs | Trigger.dev |
| Payments | Polar ($14 one-time) |
| Error Tracking | Sentry |
| Avatars | hashvatar (deterministic, no uploads) |

## Tiers

| | Free | Pro ($14 one-time) |
|---|---|---|
| Groups | Join 1 (max 30 members) | Join up to 5 (max 50 members) |
| Create private groups | No | Yes |
| Pauses/month | 2 | 4 |
| Leaderboard | Group only | Group + Global |
| Profile badge | No | Yes |

## Docs

- [Stack](./stack.md)
- [Schema](./schema.md)
- [Features](./features.md)
- [Freemium Model](./freemium-model.md)
- [Notifications](./notifications.md)
- [Routes](./routes.md)
- [Trigger.dev GitHub Actions](./TRIGGER_GITHUB_ACTIONS.md)
- [Timeline](./timeline.md)

## Post-MVP

- Solutions sharing
- Activity feed (group-scoped)
- Resources hub
- In-app notification inbox
- Redis leaderboard cache
- PostHog analytics
- Custom roadmaps (Pro admin perk)
- Upstash Realtime (WebSocket)
