-- Remove PENDING_VERIFICATION and VERIFICATION_FAILED from SolveStatus enum
-- Recovery-safe: SolveStatus (3 values) already exists from a prior partial run,
-- column still references SolveStatus_old (5 values), no default set.

-- Step 1: update any rows using the removed values
UPDATE "UserSolve" SET "status" = 'MISSED'::"SolveStatus_old" WHERE "status"::text IN ('PENDING_VERIFICATION', 'VERIFICATION_FAILED');

-- Step 2: swap the column to use the new 3-value enum
ALTER TABLE "UserSolve" ALTER COLUMN "status" TYPE "SolveStatus" USING "status"::text::"SolveStatus";

-- Step 3: restore the default
ALTER TABLE "UserSolve" ALTER COLUMN "status" SET DEFAULT 'MISSED'::"SolveStatus";

-- Step 4: drop the old enum
DROP TYPE "SolveStatus_old";
