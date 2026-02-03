# Database Schema

Current date reference: February 2026  
Database: **PostgreSQL** (hosted on Supabase / Neon)  
ORM: **Drizzle ORM**  
Schema file: `packages/db/src/schema.ts`

## Design Principles

- Heavy use of **cascading deletes** to keep data consistent
- Many **unique constraints** to prevent logical duplicates
- **Indexes** on fields frequently used in filtering/sorting
- Soft values (flags) instead of hard deletes where possible
- Monthly-resetting counters (pauses, suspensions windows)
- Separation of **problem** (evergreen) vs **daily_problem** (instance per group/day)
- Points are stored both denormalized (`user.totalPoints`) and historically (`points_history`)

## Tables Overview

| Table            | Main purpose                               | Key relations                                                 | Important fields                                                 |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `user`           | Core user entity                           | sessions, accounts, group_memberships, solves, pauses, points | username, email, totalPoints, currentStreak, pausesUsedThisMonth |
| `group`          | Group / team container                     | members, dailyProblems, creator                               | name, type, platform, maxMembers                                 |
| `group_member`   | Membership + role                          | user ↔ group                                                  | role (admin/member)                                              |
| `problem`        | Reusable problem definition                | dailyProblems, solves                                         | slug, title, source, difficulty                                  |
| `daily_problem`  | One problem assignment per group per day   | group, problem, solves, firstSolver                           | assignedDate, slot, firstSolverId                                |
| `user_solve`     | User's solve attempt + verification result | user, dailyProblem, problem                                   | isVerified, pointsEarned, isFirstInGroup                         |
| `pause_request`  | User's request to skip a day               | user, dailyProblem                                            | category, status, isAutoApproved                                 |
| `points_history` | Audit trail of all point changes           | user, user_solve (optional)                                   | amount, reason                                                   |
| `session`        | Better-Auth session                        | user                                                          | expiresAt, token                                                 |
| `account`        | Better-Auth linked accounts / credentials  | user                                                          | providerId, accessToken, password                                |
| `verification`   | Email verification / password reset tokens | —                                                             | identifier, value, expiresAt                                     |

## Detailed Table Documentation

### `user`

Central entity representing a platform user.

**Important fields**

- `username` – unique, public identifier
- `email` – unique, used for login & notifications
- `leetcodeHandle` – required, used for verification
- `codeforcesHandle` – optional
- `totalPoints` – denormalized sum of all earned points
- `currentStreak` / `longestStreak` – maintained by background jobs
- `pausesUsedThisMonth` – resets monthly
- `unexcusedMissCount` – rolling 30-day counter
- `isSuspended` / `suspendedUntil` – suspension state

**Indexes**

- `username` → fast profile lookup
- `totalPoints`, `currentStreak` → leaderboard sorting

### `group`

Container for users participating in the same daily challenge.

**Fields**

- `type`: `public` | `private`
- `platform`: `leetcode` | `codeforces` (future multi-platform support)
- `maxMembers`: usually 30 (50 for premium groups)
- `currentMemberCount`: denormalized count (updated via triggers or jobs)
- `banned` / `banReason` / `banExpires`: group-level banning

### `group_member`

Junction table + role.

**Unique constraint**

```sql
(group_id, user_id)
```

Prevents a user from joining the same group twice.

### `problem`

Evergreen problem metadata (not tied to any date/group).

**Fields**

- `slug` – canonical identifier (usually leetcode slug)
- `roadmapIndex` – position in NeetCode 250 / other roadmaps
- `source` – `leetcode` | `codeforces`

### `daily_problem`

One row = **one problem assigned to one group on one day**.

**Slot field**

Allows future expansion to 2 problems per day.

**Unique constraint**

```sql
(group_id, assigned_date, slot)
```

Ensures max 1 problem per slot per day per group.

### `user_solve`

Records that a user **marked a daily problem as solved** and whether it was verified.

**Business rules enforced via application logic / jobs**

- One `user_solve` per `(user, daily_problem)`
- `pointsEarned` includes base + bonuses
- `isFirstInGroup` / `isFirstOnPlatform` – set by verification job
- `wasEarlySolver` – solved < 6 hours after assignment

### `pause_request`

User requests to skip a daily problem without penalty.

**Lifecycle**

1. User creates request → `status` = pending (not yet implemented)
2. First 2 per month → `isAutoApproved = true`
3. Others → admin review
4. Final state: `approved` | `rejected`

### `points_history`

Immutable log of every point change.

**Reasons (examples)**

- "daily_solve"
- "first_in_group"
- "solution_upvote_received"
- "missed_day_unexcused"
- "shared_solution"
- "approved_resource"
- ...

Used for:

- Detailed user points breakdown
- Audit / dispute resolution
- Analytics

## Relations (Drizzle ORM)

All important relations are defined using the `relations` helper.

Most important ones:

```ts
user → many(groupMember)          // user's groups
group → many(groupMember)         // group's members
group → many(dailyProblem)        // problems assigned to group
dailyProblem → many(userSolve)    // who solved it
dailyProblem → many(pauseRequest) // skip requests
user → many(userSolve)            // all solves by user
user → many(pointsHistory)        // point audit trail
```

## Important Constraints & Business Rules (enforced in code)

- User can only have **one active solve** per `daily_problem`
- Only one `firstSolver` per `daily_problem`
- `pausesUsedThisMonth` resets monthly (handled in job)
- `unexcusedMissCount` is rolling 30-day window
- Suspension after **3 unexcused misses** in 30 days
- `currentStreak` breaks on unexcused miss (unless paused)

## Indexes Summary

| Table          | Indexed fields                       | Purpose                      |
| -------------- | ------------------------------------ | ---------------------------- |
| user           | username, totalPoints, currentStreak | Profile lookup, leaderboards |
| group          | platform, createdById, isActive      | Filtering active groups      |
| group_member   | groupId, userId                      | Membership checks            |
| daily_problem  | groupId, assignedDate                | Fetch today's problem        |
| user_solve     | userId, dailyProblemId, solvedAt     | Leaderboard, history         |
| pause_request  | userId, dailyProblemId, status       | Approval queue               |
| points_history | userId, createdAt                    | History timeline             |

## Future Considerations

- Add **soft delete** column (`deleted_at`) on critical entities
- Add **reported** / **moderation** status on user-generated content
- Consider **partitioning** `points_history` and `user_solve` after ~1M rows
- Add **materialized view** or **Redis cache** for weekly/monthly leaderboards
- Add `solution` table when full solution sharing is implemented

---

Last updated: 3 Feb 2026  
Related file:

- `packages/db/src/schema.ts`
