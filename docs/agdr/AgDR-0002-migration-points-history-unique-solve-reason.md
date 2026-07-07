# Migration: unique index on PointsHistory (userSolveId, reason)

> In the context of fixing the solve-verification double-award race (plan 001), facing the fact that `applyPointsDelta` inserts a `PointsHistory` row unconditionally and no database constraint prevents a duplicate award, I decided to execute a **schema** migration adding `@@unique([userSolveId, reason])` to `PointsHistory`, to achieve database-level idempotency of point application per (solve, reason), accepting a one-time index build and a required pre-apply duplicate check on production.

**Migration type**: schema (additive unique index)
**Affected tables / entities**: `PointsHistory`
**Estimated downtime**: none — an additive index; Prisma builds it non-concurrently, so on a large prod table it briefly locks writes to `PointsHistory`. See Testing/Observability for the concurrent-index note.
**Data volume**: `PointsHistory` grows with every point change (one+ rows per solve/pause/miss/admin action) — could be large in prod; unknown exact count.
**Target environment(s)**: dev/local now → staging → prod

## Context

The solve-verification flow (`verifyAndMarkSolved` in `src/server/problems/problems.dao.ts`) reads solved-status and the first-solver count *outside* the awarding transaction, and `applyPointsDeltaInTx` (`src/server/points/points.dao.ts`) does an unconditional `tx.pointsHistory.create(...)`. Two near-simultaneous solve submissions for the same user can therefore each insert a `DAILY_SOLVE` ledger row — doubling points. `PointsHistory` currently has only two non-unique indexes (`[userId, createdAt]`, `[userId, groupId, reason]`) and no uniqueness guard.

Plan 001 fixes the application logic (re-check inside the transaction + atomic first-solver claim). This migration is the **database-level backstop**: with a unique index on `(userSolveId, reason)`, a duplicate `DAILY_SOLVE` insert for the same `userSolve` raises a constraint violation instead of silently double-awarding. `userSolveId` is nullable, and Postgres treats NULLs as distinct in unique indexes, so ledger rows not tied to a solve (join bonus, admin adjustments) are unaffected.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **`@@unique([userSolveId, reason])` on PointsHistory** | DB-enforced idempotency; NULL-userSolveId rows unaffected; cheap; reversible | Fails to apply if duplicate rows already exist (must dedupe first); non-concurrent build briefly locks writes |
| Application-only guard (no DB constraint) | No migration, no index build | No protection against true-simultaneous transactions that both pass the in-tx re-read before either commits |
| Composite PK / redesign of the ledger | Strongest integrity | Large blast radius on an append-only audit table; overkill for this fix |

## Decision

Chosen: **`@@unique([userSolveId, reason])`**, because it is the minimal, reversible, DB-level guarantee that pairs with plan 001's application-level fix to close the race completely, without disturbing the immutable append-only ledger design or the null-userSolveId rows.

## Rollback Plan

1. `DROP INDEX "PointsHistory_userSolveId_reason_key";` (name per the generated migration) — reverses the migration with no data change.
2. Revert the `@@unique` line in `prisma/schema.prisma` and delete the migration directory, or `prisma migrate resolve --rolled-back <migration>` in prod.
3. No data transformation is applied, so rollback is a pure index drop — safe at any time.

**Rollback tested against**: unit fixture / local Postgres (the index is created and can be dropped locally). Not yet tested against a copy of prod — **do a copy-of-prod dry run before the prod apply** because of the duplicate-row risk below.
**Rollback window**: unbounded — dropping the index never loses data.

## Cross-Service Consumers

- **none** — `PointsHistory` is an internal ledger written only by pstrack's own DAO layer (`applyPointsDelta`) and read by leaderboard/points queries within the same app. No external service reads or writes it.

Deploy-order constraint:

- **none** — the app code tolerates the index existing before or after deploy (the constraint only ever fires on a duplicate insert, which the plan-001 code no longer attempts).

## Testing Plan

- **Dev smoke**: `make up` (local Postgres) then `bun run db:migrate --name points_history_unique_solve_reason`; confirm the generated `migration.sql` contains `CREATE UNIQUE INDEX ... ON "PointsHistory"("userSolveId", "reason")` and that it applies cleanly to the (empty) local DB.
- **Staging verify**: before applying, run the duplicate check —
  `SELECT "userSolveId", reason, COUNT(*) FROM "PointsHistory" WHERE "userSolveId" IS NOT NULL GROUP BY 1,2 HAVING COUNT(*) > 1;`
  Expect zero rows. If non-empty, the pre-fix bug already produced duplicates: dedupe (keep the earliest `createdAt` per pair, delete the extras) before applying, and reconcile the affected users' `totalPoints`.
- **Prod**: repeat the duplicate check on a copy of prod first. Consider `CREATE UNIQUE INDEX CONCURRENTLY` (hand-written migration) instead of Prisma's default non-concurrent build to avoid a write lock on a large `PointsHistory`.
- **Regression**: the plan-002 integration harness will add a two-concurrent-solves test asserting exactly one `DAILY_SOLVE` + one `FIRST_IN_GROUP` row.

## Observability

- **During apply**: watch the `bunx prisma migrate deploy` step in the CI deploy job (`.github/workflows/ci.yml`) — a failure here almost certainly means pre-existing duplicate rows.
- **Post-apply**: no `PointsHistory` uniqueness-violation errors in Sentry under normal solve traffic (the plan-001 code should never trigger the constraint); `User.totalPoints` for a sampled user equals the sum of their ledger deltas.
- **Alerts armed**: Sentry error-rate on the solve endpoint (`POST /problems/today/solve`) — a spike post-deploy would indicate the constraint firing on a legitimate path (should not happen).

## Consequences

- Point application becomes idempotent at the database level per `(userSolveId, reason)` — the double-award race cannot silently double-count even under true concurrency.
- Any future feature that legitimately needs two ledger rows of the same reason for one solve would be blocked by this constraint and require revisiting it.
- Prod apply now carries a mandatory pre-check/dedupe step (documented above) — a deliberate cost that surfaces latent duplicate data from the pre-fix bug.

## Artifacts

- Ticket: husamql3/pstrack#244 — https://github.com/husamql3/pstrack/issues/244
- Commits / PRs: plan 001 on branch `advisor/execute-001-009`
- Staging-run log: TBD
- Post-apply dashboard snapshot: TBD
