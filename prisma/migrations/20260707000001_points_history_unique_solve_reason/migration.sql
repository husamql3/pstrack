-- Deduplicate PointsHistory rows that would violate the new
-- (userSolveId, reason) uniqueness before creating the index.
--
-- These duplicates are double-award / double-penalty artifacts left over
-- from the pre-fix verify-submission / mark-missed concurrency bug (#244):
-- the same solve received two ledger rows for the same reason (e.g. two
-- MISSED_DAY entries). Within a (userSolveId, reason) group the delta is
-- identical, so keeping the earliest row and deleting the rest does not
-- change any user's totalPoints. Rows with a NULL userSolveId (admin
-- adjustments, streak bonuses not tied to a solve) are never touched —
-- NULLs are treated as distinct by the unique index.
DELETE FROM "PointsHistory"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "userSolveId", "reason"
        ORDER BY "createdAt" ASC, "id" ASC
      ) AS rn
    FROM "PointsHistory"
    WHERE "userSolveId" IS NOT NULL
  ) ranked
  WHERE ranked.rn > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "PointsHistory_userSolveId_reason_key" ON "PointsHistory"("userSolveId", "reason");
