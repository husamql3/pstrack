# Timeline

Show up. Solve. Repeat.
Stay consistent with LeetCode — solve one problem a day, earn points, and compete with your group.

## Phase 1 — Project Setup & Tooling · [#219](https://github.com/husamql3/pstrack/issues/219)

- [x] Update logo & slogan
- [x] `npx skills add nutlope/hallmark`
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
- [x] Build onboarding page (`/onboarding`) — set username
- [x] Integrate hashvatar on user profile display

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
- [x] Set up Trigger.dev job: `expire-join-requests` (hourly cron, marks PENDING > 1 day as EXPIRED)
- [x] Email templates: `join-request.tsx`, `join-approved.tsx`, `join-rejected.tsx`, `join-expired.tsx`, `removed-from-group.tsx` (wired into DAO via `groups.notifications.ts`)
- [x] Enforce group limits (Free: 1 group / 30 members, Pro: 5 groups / 50 members)
- [x] Join via invite link (`POST /api/groups/join-by-invite` + `/groups/join/$inviteCode` route)
- [x] Group problems table (`GET /api/groups/:id/problems` + `group-problems-table` UI)
- [x] Group slugs (URL by slug, unique constraint, slug-based filters)

**Deliverable:** Users can create groups, join/leave, admins can manage members and requests

---

## Phase 4 — Daily Problem System · [#222](https://github.com/husamql3/pstrack/issues/222)

- [x] Seed NeetCode 250 problems via `POST /api/admin/problems/seed`
- [x] Set up Trigger.dev job: `assign-daily-problem` (midnight UTC cron — creates `DailyProblem` row per active group, fans out daily-problem email digest)
- [x] `GET /api/problems/today` — return today's problem + user's current `UserSolve` status
- [x] `GET /api/problems/roadmap` — NeetCode 250 list with user solve history
- [x] Build dashboard page (`/dashboard`) — today's problem card, solve/pause buttons, streak display
- [x] Build roadmap page (`/problems`)
- [x] `POST /api/problems/today/solve` — **synchronous** verification: fetch LeetCode `recentAcSubmissionList` at click time, award points + streak inline. No PENDING_VERIFICATION state; failures return a 409 to the client.
- [x] ~~Set up Trigger.dev job: `verify-submission`~~ — **dropped**, replaced by sync verification above. Async verification can return post-MVP if rate limits become an issue.
- [x] `POST /api/problems/today/pause` — set status to PAUSED, decrement available pauses
- [x] Set up Trigger.dev job: `mark-missed` (midnight UTC cron — sweeps yesterday: primary group only, skip join-day, -3 pts, streak = 0, PointsHistory MISSED_DAY)
- [x] Set up Trigger.dev job: `reset-monthly-pauses` (1st of month cron)
- [x] Email template: `daily-problem.tsx` (wired into `assign-daily-problem`, respects `notifyDailyProblem`)
- [x] ~~Email templates: `solve-verified.tsx`, `verification-failed.tsx`~~ — **dropped** with sync verification.

**Deliverable:** Daily problem loop works end-to-end — assign, solve, verify, pause, miss

---

## Phase 5 — Points, Streaks & Gamification · [#223](https://github.com/husamql3/pstrack/issues/223)

- [x] Add points model schema changes from `docs/POINTS.md` (`currentStreakStartedAt`, `verificationFailuresThisMonth`, `proSource`, `PointsHistory.groupId`, new `PointReason` values)
- [x] Add atomic `pointsDao.applyPointsDelta()` for point mutations, `PointsHistory` audit rows, floor-at-0 balances, and points-threshold Pro unlock
- [x] Refactor point-changing flows to use `applyPointsDelta`
- [x] Difficulty-based solve points in the sync solve flow (Easy +5, Medium +10, Hard +15)
- [x] First-in-group bonus (+10) logged separately as `FIRST_IN_GROUP`
- [x] Streak multiplier bonuses (7d / 30d) logged separately as `STREAK_MULTIPLIER_BONUS`
- [x] Comeback bonus (+3) after a missed streak
- [x] Early-bird bonus (+2) when the LeetCode submission lands within 12 hours of `DailyProblem.assignedDate`
- [x] Join-group bonus (+20) awarded once per unique group using immutable `PointsHistory`
- [x] Set `currentStreakStartedAt` on the first solve of a new streak
- [x] Pause penalty (-5) logged as `PAUSE` while preserving streak
- [x] Pause confirmation UI shows the -5 point cost before charging
- [x] `mark-missed` clawback transaction: bonus sum, `CLAWBACK`, `MISSED_DAY`, streak reset, streak-start clear
- [x] Streak increment / reset logic in the sync solve flow and `mark-missed` job
- [x] `user.longestStreak` updated when `currentStreak` exceeds it
- [x] Rename monthly reset job to `reset-monthly-counters` and reset both pause and verification-failure counters
- [x] Verification failure tracking: failed solve checks increment the monthly counter but never break streaks
- [x] Badge evaluation after each solve: streak badges (7/30/100), First Solver (10/50), Consistent (30)
- [x] `GET /api/v3/users/me` returns points economy fields (`pausesRemainingThisMonth`, `verificationFailuresRemainingThisMonth`, `proSource`, `pointsToProUnlock`)
- [x] Email templates: `streak-milestone.tsx`, `badge-earned.tsx`, `pro-unlocked-by-points.tsx`

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

- [x] Create Polar product ($5, one-time)
- [ ] Set up promo codes in Polar dashboard
- [x] Configure Better Auth Polar plugin (webhook handler, `isPro` sync)
- [ ] Build billing settings page (`/settings/billing`) — Pro status, upgrade CTA (stub exists)
- [ ] Add Pro gates in UI: group limits, global leaderboard, private group creation
- [ ] Add Pro gates in API: enforce on relevant Elysia routes

**Deliverable:** Users can purchase Pro, gates enforced on client and server

---

## Phase 8 — User Profiles & Settings · [#226](https://github.com/husamql3/pstrack/issues/226)

- [x] `GET /api/users/:username` — public profile endpoint
- [x] `PATCH /api/users/me` — update profile endpoint
- [ ] `DELETE /api/users/me` — account deletion
- [x] Build public profile page (`/$username`)
- [x] Build settings pages (`/settings/account`, `/settings/profile`, `/settings/notifications`, `/settings/billing`)
- [ ] Email templates: `password-changed.tsx`, `security-alert.tsx`, `account-deletion.tsx`

**Deliverable:** Full profile and settings experience

---

## Phase 9 — Admin Dashboard · [#227](https://github.com/husamql3/pstrack/issues/227)

- [x] Platform admin flag on `User` (Better Auth `role` column, enforced on `/admin/*` routes)
- [x] `GET /api/admin/users` + `/admin/users` page
- [x] `PATCH /api/admin/users/:id` — adjust points, ban
- [x] `GET /api/admin/groups` + `DELETE /api/admin/groups/:id`
- [x] `GET /api/admin/stats` + `/admin` overview page
- [x] Admin route guard (redirect non-admins via `requirePlatformAdmin` + `_admin.tsx` layout)
- [x] Admin audit log (`/admin/audit`)
- [x] Feature flags admin (`/admin/flags`)
- [x] System config admin (`/admin/config`)
- [x] Email template console (`/admin/emails`)
- [x] Admin group create + manage (members, join-requests, settings)

**Deliverable:** Platform admins can manage users, groups, and view stats

---

## Phase 10 — Polish & Launch · [#228](https://github.com/husamql3/pstrack/issues/228)

- [x] Route-level `errorComponent` on dashboard, problems, groups, group detail (inline `RouteErrorFallback` + root `ErrorPage` for unhandled crashes)
- [ ] Error boundaries on remaining pages (settings, profile, admin, leaderboard)
- [x] Loading skeletons on dashboard, problems, groups, group detail
- [ ] Loading skeletons on remaining data-fetching routes
- [ ] Empty states (no group joined, no problems solved yet, etc.)
- [ ] Mobile-responsive UI audit
- [x] Sentry source map upload in CI
- [x] Environment variables documented in `.env.example`
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
