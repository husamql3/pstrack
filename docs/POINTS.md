# Points & Gamification Model

The full points, streaks, and Pro-via-points design for PStrack v3.

Designed around a single goal: **increase daily tension**. Every rule below is calibrated so that showing up matters and missing a day actually hurts - without making the system so punitive that users rage-quit.

---

## Earn Rules

| Event | Points |
|---|---|
| Solve Easy | +5 |
| Solve Medium | +10 |
| Solve Hard | +15 |
| First in group to solve (per day) | +10 |
| Comeback (first solve after a `MISSED` day) | +3 |
| Early-bird (LeetCode submission timestamp within 12 hours of the daily problem being assigned) | +2 |
| Join a group (first time joining each unique group) | +20 |
| Streak multiplier - 7+ days | 1.2x on solve points |
| Streak multiplier - 30+ days | 1.5x on solve points |

Notes:
- Streak multiplier applies only to base solve points (5/10/15), not to first-in-group, comeback, early-bird, or join.
- Multiplier *delta* (the extra points beyond base) is logged as a separate `STREAK_MULTIPLIER_BONUS` row in `PointsHistory` so clawback can find it.
- First-in-group is flat +10 regardless of difficulty.
- Join bonus fires **once per unique group per user, ever**. Leaving and rejoining the same group does *not* re-award. Enforced by checking for an existing `JOIN_GROUP` row in `PointsHistory`.

## Lose Rules

| Event | Points |
|---|---|
| Miss | **-5 flat + clawback** of all multiplier-delta and first-solver bonuses accumulated during the now-broken streak |
| Pause | -5 flat (streak preserved) |
| Verification failure - 1st in month | 0 (grace, audit-only) |
| Verification failure - 2nd+ in month | Treated as MISS (full penalty + clawback + streak broken) |
| Floor | 0 - scores cannot go negative |

### Clawback Mechanics

When a user misses a day and their streak breaks, the clawback retroactively reverses *all bonuses* that streak earned them. Base solve points are kept; bonuses are gone.

Clawback sum query:

```
SUM(delta) FROM PointsHistory
WHERE userId = ?
  AND createdAt >= user.currentStreakStartedAt
  AND reason IN (STREAK_MULTIPLIER_BONUS, FIRST_IN_GROUP)
```

The mark-missed job:
1. Sums the bonus rows (above)
2. Writes a `CLAWBACK` row with `delta = -sum`
3. Writes a `MISSED_DAY` row with `delta = -5`
4. Clears `User.currentStreakStartedAt`
5. Resets `User.currentStreak` to 0
6. Updates `User.totalPoints` (clamped to floor 0)

**All five steps must run in a single database transaction.** If clearing `currentStreakStartedAt` happens before summing, the sum returns 0 and the user gets a free miss.

### Pause as Streak Insurance

Pause is positioned as paid streak insurance. The user trades -5 points to preserve their streak rather than take the clawback hit on a miss. The decision feels meaningful at every streak length:

- New user, no streak: pause saves -5 (miss) by paying -5 (pause). Indifferent.
- 30-day streaker with 150 bonus points: pause saves -155 by paying -5. Clearly worth it.

Pre-pause UI must show "Pausing costs -5 points" before the confirm. No surprise charges.

### Verification Failure Escalation

`SolveStatus` stays a clean terminal-state enum (`SOLVED | PAUSED | MISSED`). Verification failures are tracked separately via `User.verificationFailuresThisMonth`:

- First failure this month: counter increments, no points lost, no streak break. Logged as `VERIFICATION_FAILURE_GRACE` with `delta = 0` for audit trail.
- Second and beyond: treated as a full MISS (-5 + clawback + streak break).

Counter resets monthly via the existing Trigger.dev job (rename `reset-monthly-pauses` → `reset-monthly-counters` to cover both).

---

## Pro Economy

Pro is unlockable two ways:

| Path | Cost |
|---|---|
| Polar purchase | $14 standard, $9 sale |
| Points threshold | 3,000 points earned in-app |

**Pro is permanent once unlocked**, by either path. There is no revocation - a user who reaches 3,000, gets Pro, then clawback drops them below 3,000 keeps Pro. Matches the lifetime promise of the $14 purchase.

### Why 3,000?

Working from average earn velocity of ~14 points/day (mix of difficulty, with comeback and early-bird factored in), 3,000 points is roughly 7 months of consistent play. The threshold is deliberately set high enough that **a $14 buyer's mental math always favors paying** - 7 months of grinding to save $14 is irrational for anyone with disposable income. This protects revenue while still offering a legitimate free path for highly committed users.

### Auto-Grant

When a user's `totalPoints` crosses 3,000 for the first time, the system:
1. Sets `User.isPro = true`
2. Sets `User.proSource = POINTS_THRESHOLD`
3. Fires the existing Pro-unlocked notification/email flow

This happens as a side effect of the same transaction that mutates points - **not a separate cron**. Users must see Pro status update instantly upon crossing the threshold.

### Post-Pro Motivation

Tension fades after a user crosses 3,000 (Pro is permanent, points stop having terminal value). The existing leaderboard, badges, and streak prestige carry post-Pro motivation. If this becomes a problem, future work can add prestige tiers (e.g., new badges at 5,000 / 10,000) - but not before launch.

---

## Tension Audit

| Lever | Before redesign | After |
|---|---|---|
| Miss severity | Flat -3 | -5 flat + scaling clawback (proportional to streak length and bonus history) |
| Pause leak | Free unlimited until monthly cap | -5 cost per pause (still preserves streak) |
| Verification leak | Unlimited free grace | One grace per month, then full miss penalty |
| Stakes | Vanity only (leaderboard rank) | Currency (Pro unlock at 3,000) |
| Per-day stakes | Flat regardless of difficulty | Hard days worth 3x Easy - non-uniform tension |
| Onboarding push | None | +20 join + multiplier on first solves |
| Safety net for clawback | None | Comeback bonus (+3) softens rage-quit risk |

---

## Schema Changes

All changes are additive and ship in a single migration pre-launch.

### `User`

```prisma
model User {
  // existing fields ...
  currentStreakStartedAt         DateTime?    // streak boundary marker for clawback
  verificationFailuresThisMonth  Int          @default(0)
  proSource                      ProSource?   // null until isPro flips
}

enum ProSource {
  POLAR_PURCHASE
  POINTS_THRESHOLD
  ADMIN_GRANT
}
```

### `PointsHistory`

```prisma
model PointsHistory {
  // existing fields ...
  groupId   String?  // nullable FK for group-scoped queries
  group     Group?   @relation(fields: [groupId], references: [id])

  @@index([userId, groupId, reason])  // for JOIN_GROUP existence check
}
```

### `PointReason` enum

```prisma
enum PointReason {
  // existing:
  DAILY_SOLVE
  FIRST_IN_GROUP
  STREAK_MULTIPLIER_BONUS
  MISSED_DAY
  ADMIN_ADJUSTMENT
  // new:
  PAUSE
  CLAWBACK
  COMEBACK
  EARLY_BIRD
  JOIN_GROUP
  VERIFICATION_FAILURE_GRACE
}
```

### `Group`

Add reverse relation only:

```prisma
model Group {
  // ...
  pointsHistory PointsHistory[]
}
```

### Unchanged

- `SolveStatus` enum stays `SOLVED | PAUSED | MISSED`. Verification failures are tracked via the counter, not a status value.
- `GroupMember` schema unchanged. Join bonus enforcement uses a `PointsHistory` existence check rather than a flag on `GroupMember` (whose cascade-delete on leave would silently break lifetime-per-group enforcement).
- `DAILY_SOLVE` reason is *not* split by difficulty. Difficulty is already discoverable via the existing `UserSolve → DailyProblem → Problem.difficulty` chain.

### `UserSolve.pointsEarned` semantics

Stores only the **base solve points** (5 / 10 / 15). Bonuses (multiplier delta, first-in-group, comeback, early-bird) are separate `PointsHistory` rows. This keeps clawback math straightforward - the clawback query targets bonus rows, never base-solve rows.

---

## Implementation Notes

### Atomic Points Mutation

Every point change goes through a single DAO function that owns the floor:

```ts
applyPointsDelta(userId, delta, reason, { groupId?, userSolveId?, adminNote? })
```

This function:
1. Writes the `PointsHistory` row
2. Updates `User.totalPoints` clamped to `Math.max(0, newBalance)`
3. If crossing 3,000 and `!isPro`: sets `isPro = true`, `proSource = POINTS_THRESHOLD`
4. Runs in a single transaction

Callers never compute new balances directly. The floor is enforced here and nowhere else.

### Trigger.dev Job Changes

| Job | Change |
|---|---|
| `verify-submission` | Add comeback/early-bird detection. Write `STREAK_MULTIPLIER_BONUS` and `FIRST_IN_GROUP` rows separately so clawback can find them. Set `currentStreakStartedAt` on the first solve of a new streak. |
| `mark-missed` | Run the clawback sum, write CLAWBACK + MISSED_DAY rows, clear `currentStreakStartedAt`, reset streak. All in one transaction. |
| `reset-monthly-pauses` | Rename to `reset-monthly-counters`. Reset both `pausesUsedThisMonth` and `verificationFailuresThisMonth`. |

### Edge Cases

- **Negative balance**: impossible by design. The floor lives in `applyPointsDelta`, not the UI.
- **Clawback exceeds current balance**: balance clamps to 0; the "excess" is not stored anywhere. Pro threshold remains an absolute 3,000.
- **Pro user who reaches 3,000 via points after already purchasing $14**: no-op. `isPro` is already true; `proSource` stays `POLAR_PURCHASE`.
- **First solve of a new streak**: `currentStreakStartedAt` is set to the solve's `createdAt`. Clawback uses `>=` comparison so this row's bonuses (if any) are included.
- **Verification job retries**: only the *final* failure increments `verificationFailuresThisMonth`. Intermediate retries within the same Trigger.dev run don't count.
- **Pause used on the same day as a previously-verified solve**: not allowed; UserSolve unique constraint `(userId, dailyProblemId)` prevents double-state.

---

## Badge Triggers

Badges are evaluated after every solved submission. The check queries `UserBadge` for existing awards to avoid duplicates. New badges are returned in the `MarkSolvedResult` so the client can show a celebration modal.

| Badge | Condition |
|---|---|
| `STREAK_7` / `STREAK_30` / `STREAK_100` / `STREAK_365` | `currentStreak >= N` |
| `SOLVED_1` / `SOLVED_10` / `SOLVED_50` / `SOLVED_100` | Total `SOLVED` solve count crosses `N` |
| `NC250_COMPLETE` / `NC150_COMPLETE` / `BLIND75_COMPLETE` | All problems in the corresponding roadmap solved |
| `FIRST_SOLVER_1` / `FIRST_SOLVER_10` / `FIRST_SOLVER_50` | Total first-in-group solves crosses `N` |
| `CONSISTENT_30` | 30-day `SOLVED`-or-`PAUSED` streak (paused days count) |

The `UserBadge` table has a unique constraint on `(userId, type)` so re-evaluation after every solve is idempotent.
