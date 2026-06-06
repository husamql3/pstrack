# Data Flows

End-to-end lifecycles for the load-bearing user actions. Cross-references the resource modules in `src/server/` and the Trigger.dev tasks in `src/server/jobs/trigger/`.

---

## Daily Solve Lifecycle

```
1. Midnight UTC
   assign-daily-problem job
     → creates DailyProblem for each active group
     → sends daily digest email to opted-in members

2. User clicks "Mark as Solved"
   POST /api/v3/problems/today/solve
     → creates UserSolve { status: PENDING_VERIFICATION }
     → triggers verify-submission Trigger.dev task

3. verify-submission job
   → polls LeetCode GraphQL / Codeforces API
   → if accepted submission found after problem.assignedDate:
       db.$transaction([
         update UserSolve { status: SOLVED, verifiedAt, pointsEarned }
         if firstSolver: update DailyProblem.firstSolverId, award +10 bonus
         if streak >= 7: award multiplier bonus row
         check/award badges
         if totalPoints >= PRO_THRESHOLD: set isPro = true
       ])
     → returns MarkSolvedResult { newBadges, newStreak, crossedProThreshold }

4. Client receives result
   → invalidates ["problems", "today"] query
   → if newBadges.length > 0: shows celebration modal
   → if crossedProThreshold: shows Pro unlock toast

5. End of day (midnight UTC, next run)
   mark-missed job
     → finds UserSolves from yesterday still PENDING/null
     → sets status MISSED
     → applies −5 points, clawbacks same-day bonuses
     → resets currentStreak = 0, clears currentStreakStartedAt
```

### Key invariants

- `verify-submission` and `mark-missed` both write through `applyPointsDelta` — the floor (`totalPoints >= 0`) and the Pro auto-grant live in one place.
- The clawback sum must be computed *before* `currentStreakStartedAt` is cleared. Same transaction.
- Streak multiplier bonus is written as a separate `PointsHistory` row (`reason = STREAK_MULTIPLIER_BONUS`) so clawback can find and reverse just the delta, not the base solve points.
- `firstSolver` is awarded only if no `firstSolverId` is set on the `DailyProblem` yet — race-safe via the unique constraint.
