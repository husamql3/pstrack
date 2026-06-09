-- Remove PENDING_VERIFICATION and VERIFICATION_FAILED from SolveStatus enum

-- Step 1: drop the existing default so ALTER TYPE can proceed
ALTER TABLE "UserSolve" ALTER COLUMN "status" DROP DEFAULT;

-- Step 2: rename the existing 5-value enum
ALTER TYPE "SolveStatus" RENAME TO "SolveStatus_old";

-- Step 3: create the clean 3-value enum
CREATE TYPE "SolveStatus" AS ENUM ('SOLVED', 'PAUSED', 'MISSED');

-- Step 4: update any rows using the removed values
UPDATE "UserSolve" SET "status" = 'MISSED'::"SolveStatus_old" WHERE "status"::text IN ('PENDING_VERIFICATION', 'VERIFICATION_FAILED');

-- Step 5: swap the column to use the new 3-value enum
ALTER TABLE "UserSolve" ALTER COLUMN "status" TYPE "SolveStatus" USING "status"::text::"SolveStatus";

-- Step 6: restore the default
ALTER TABLE "UserSolve" ALTER COLUMN "status" SET DEFAULT 'MISSED'::"SolveStatus";

-- Step 7: drop the old enum
DROP TYPE "SolveStatus_old";
