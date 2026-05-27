-- AlterTable: drop Codeforces field, add roadmap boolean flags
ALTER TABLE "Problem" DROP COLUMN IF EXISTS "codeforcesId";
ALTER TABLE "Problem" ADD COLUMN "neetcode250" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Problem" ADD COLUMN "neetcode150" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Problem" ADD COLUMN "blind75" BOOLEAN NOT NULL DEFAULT false;
