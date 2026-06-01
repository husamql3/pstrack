-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BadgeType" ADD VALUE 'STREAK_365';
ALTER TYPE "BadgeType" ADD VALUE 'SOLVED_1';
ALTER TYPE "BadgeType" ADD VALUE 'SOLVED_10';
ALTER TYPE "BadgeType" ADD VALUE 'SOLVED_50';
ALTER TYPE "BadgeType" ADD VALUE 'SOLVED_100';
ALTER TYPE "BadgeType" ADD VALUE 'NC250_COMPLETE';
ALTER TYPE "BadgeType" ADD VALUE 'NC150_COMPLETE';
ALTER TYPE "BadgeType" ADD VALUE 'BLIND75_COMPLETE';
ALTER TYPE "BadgeType" ADD VALUE 'FIRST_SOLVER_1';
