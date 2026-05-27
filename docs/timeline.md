# Timeline


Show up. Solve. Repeat.
Stay consistent with LeetCode — solve one problem a day, earn points, and compete with your group.

## Phase 1 — Project Setup & Tooling · [#219](https://github.com/husamql3/pstrack/issues/219)

- [ ] Update logo & slogan
- [ ] `npx skills add nutlope/hallmark`
- [x] Initialize TanStack Start project with Bun
- [x] Configure TypeScript (strict mode)
- [x] Set up Biome (linting + formatting, `biome.json` config)
- [x] Set up Lefthook (`pre-commit: biome check --write`, `pre-push: bun run typecheck`)
- [x] Configure T3-env for environment variable validation
- [x] Set up Knip for unused code detection
- [x] Mount Elysia inside TanStack Start server middleware
- [x] Wire up Eden Treaty client in `src/client/lib/eden.ts`
- [x] Configure `@prisma/adapter-neon` + `@neondatabase/serverless` in Prisma client setup
- [x] Set up Neon database, initialize Prisma schema, run first migration
- [x] Configure Sentry (client: `@sentry/react`, server: `@sentry/bun`)
- [x] Set up GitHub Actions `ci.yml` with `.bun` cache:
  - [x] Cache `~/.bun/install/cache`
  - [x] Jobs (parallel): typecheck, `biome ci`, knip, `vitest run`, build
- [x] Set up GitHub Actions `release.yml` (merge to main):
  - [x] Same quality + test + build jobs
  - [x] Sentry source map upload

**Deliverable:** Repo boots, Elysia handles `/api/ping`, Eden client calls it with full type safety

---

## Phase 2 — Auth · [#220](https://github.com/husamql3/pstrack/issues/220)

- [x] Install and configure Better Auth (Google, GitHub, magic link)
- [x] Add Polar plugin to Better Auth config
- [x] Wire Better Auth to `/api/auth/*` inside Elysia
- [x] Set up Resend + email templates (`magic-link.tsx`, `welcome.tsx`)
- [x] Build login page (`/login`)
- [x] Add auth guard to TanStack Router (`_authenticated/` layout, username gate → `/onboarding`)
- [ ] Build onboarding page (`/onboarding`) — set username
- [ ] Integrate hashvatar on user profile display

**Deliverable:** Users can sign up, log in, and complete onboarding

---

## Phase 3 — Groups · [#221](https://github.com/husamql3/pstrack/issues/221)

- [x] Build group creation form (`/groups/new`)
- [x] Build public group browse page (`/groups`)
- [x] `POST /api/groups` — create group endpoint
- [x] `GET /api/groups` — list public groups endpoint
- [x] `POST /api/groups/:id/join` — request to join (public) or instant join (private)
- [x] `GET /api/groups/:id` — group detail endpoint
- [x] Build group overview page (`/groups/$groupId`)
- [x] `GET /api/groups/:id/join-requests` — list pending requests
- [x] `PATCH /api/groups/:id/join-requests/:requestId` — approve / reject
- [x] Build join requests page (`/groups/$groupId/join-requests`)
- [x] `POST /api/groups/:id/invite` — generate invite link
- [x] `DELETE /api/groups/:id/invite` — revoke invite link
- [x] Build group settings page (`/groups/$groupId/settings`)
- [x] `GET /api/groups/:id/members` + build members page
- [x] `DELETE /api/groups/:id/members/:userId` — remove member
- [x] `POST /api/groups/:id/leave` — leave group
- [ ] Set up Trigger.dev job: `expire-join-requests` (hourly cron, marks PENDING > 1 day as EXPIRED)
- [x] Email templates: `join-request.tsx`, `join-approved.tsx`, `join-rejected.tsx`, `join-expired.tsx`, `removed-from-group.tsx`
- [x] Enforce group limits (Free: 1 group / 30 members, Pro: 5 groups / 50 members)

**Deliverable:** Users can create groups, join/leave, admins can manage members and requests

---

## Phase 4 — Daily Problem System · [#222](https://github.com/husamql3/pstrack/issues/222)

- [ ] Seed NeetCode 250 problems via `POST /api/admin/problems/seed`
- [ ] Set up Trigger.dev job: `assign-daily-problem` (midnight cron — creates `DailyProblem` row per active group)
- [ ] `GET /api/problems/today` — return today's problem + user's current `UserSolve` status
- [ ] `GET /api/problems/roadmap` — NeetCode 250 list with user solve history
- [ ] Build dashboard page (`/dashboard`) — today's problem card, solve/pause buttons, streak display
- [ ] Build roadmap page (`/problems`)
- [ ] `POST /api/problems/today/solve` — create `UserSolve` (PENDING_VERIFICATION), fire Trigger.dev job
- [ ] Set up Trigger.dev job: `verify-submission` — poll LC/CF API, update status, award points
- [ ] `POST /api/problems/today/pause` — set status to PAUSED, decrement available pauses
- [ ] Set up Trigger.dev job: `mark-missed` (end-of-day cron — sets unresolved UserSolves to MISSED, applies -3 points)
- [ ] Set up Trigger.dev job: `reset-monthly-pauses` (1st of month cron)
- [ ] Email templates: `daily-problem.tsx`, `solve-verified.tsx`, `verification-failed.tsx`

**Deliverable:** Daily problem loop works end-to-end — assign, solve, verify, pause, miss

---

## Phase 5 — Points, Streaks & Gamification · [#223](https://github.com/husamql3/pstrack/issues/223)

- [ ] Points calculation in `verify-submission` job (+10 solve, +5 first in group, streak multiplier)
- [ ] All point changes logged to `PointsHistory`
- [ ] `user.totalPoints` updated denormalized on every change
- [ ] Streak increment / reset logic in `verify-submission` and `mark-missed` jobs
- [ ] `user.longestStreak` updated when `currentStreak` exceeds it
- [ ] Badge evaluation after each solve: streak badges (7/30/100), First Solver (10/50), Consistent (30)
- [ ] `POST /api/users/me` returns pauses remaining this month
- [ ] Email templates: `streak-milestone.tsx`, `badge-earned.tsx`

**Deliverable:** Points, streaks, and badges fully functional

---

## Phase 6 — Leaderboard · [#224](https://github.com/husamql3/pstrack/issues/224)

- [ ] `GET /api/leaderboard/groups/:id` — group leaderboard with period filter
- [ ] `GET /api/leaderboard/global` — global top 100 (Pro gate)
- [ ] Build leaderboard page (`/leaderboard`) with Pro paywall UI
- [ ] Build group leaderboard on `/groups/$groupId`
- [ ] Period filter: week / month / all-time (query `PointsHistory` for windowed totals)

**Deliverable:** Leaderboards live, global gated behind Pro

---

## Phase 7 — Freemium (Polar) · [#225](https://github.com/husamql3/pstrack/issues/225)

- [ ] Create Polar product ($14, one-time)
- [ ] Set up sale pricing ($9) and promo codes in Polar dashboard
- [ ] Configure Better Auth Polar plugin (webhook handler, `isPro` sync)
- [ ] Build billing settings page (`/settings/billing`) — Pro status, upgrade CTA
- [ ] Add Pro gates in UI: group limits, global leaderboard, private group creation
- [ ] Add Pro gates in API: enforce on relevant Elysia routes

**Deliverable:** Users can purchase Pro, gates enforced on client and server

---

## Phase 8 — User Profiles & Settings · [#226](https://github.com/husamql3/pstrack/issues/226)

- [ ] `GET /api/users/:username` — public profile endpoint
- [ ] `PATCH /api/users/me` — update profile endpoint
- [ ] `DELETE /api/users/me` — account deletion
- [ ] Build public profile page (`/profile/$username`)
- [ ] Build settings pages (`/settings/account`, `/settings/notifications`, `/settings/billing`)
- [ ] Email templates: `password-changed.tsx`, `security-alert.tsx`, `account-deletion.tsx`

**Deliverable:** Full profile and settings experience

---

## Phase 9 — Admin Dashboard · [#227](https://github.com/husamql3/pstrack/issues/227)

- [ ] Platform admin flag on `User` (set manually in DB)
- [ ] `GET /api/admin/users` + `/admin/users` page
- [ ] `PATCH /api/admin/users/:id` — adjust points, ban
- [ ] `GET /api/admin/groups` + `DELETE /api/admin/groups/:id`
- [ ] `GET /api/admin/stats` + `/admin` overview page
- [ ] Admin route guard (redirect non-admins)

**Deliverable:** Platform admins can manage users, groups, and view stats

---

## Phase 10 — Polish & Launch · [#228](https://github.com/husamql3/pstrack/issues/228)

- [ ] `react-error-boundary` on all routes with useful fallback UIs
- [ ] Error boundaries on all pages
- [ ] Loading skeletons on all data-fetching routes
- [ ] Empty states (no group joined, no problems solved yet, etc.)
- [ ] Mobile-responsive UI audit
- [ ] Sentry source map upload in CI
- [ ] Environment variables documented in `.env.example`
- [ ] Vercel project configured (env vars, domain)
- [ ] Soft launch to beta testers (50 users)
- [ ] Monitor error rates in Sentry

**Deliverable:** Beta launch

---

## Post-MVP Backlog

- [ ] Solutions sharing (submit, view, upvote)
- [ ] Activity feed (group-scoped, poll-based)
- [ ] Resources hub (submit links, community upvotes)
- [ ] In-app notification inbox (Upstash Realtime)
- [ ] Redis leaderboard cache
- [ ] PostHog analytics
- [ ] Custom roadmaps (Pro admin perk)
- [ ] Mobile app
