-- CreateEnum
CREATE TYPE "ProSource" AS ENUM ('POLAR_PURCHASE', 'POINTS_THRESHOLD', 'ADMIN_GRANT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PointReason" ADD VALUE 'PAUSE';
ALTER TYPE "PointReason" ADD VALUE 'CLAWBACK';
ALTER TYPE "PointReason" ADD VALUE 'COMEBACK';
ALTER TYPE "PointReason" ADD VALUE 'EARLY_BIRD';
ALTER TYPE "PointReason" ADD VALUE 'JOIN_GROUP';
ALTER TYPE "PointReason" ADD VALUE 'VERIFICATION_FAILURE_GRACE';

-- AlterTable
ALTER TABLE "PointsHistory" ADD COLUMN     "groupId" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "currentStreakStartedAt" TIMESTAMP(3),
ADD COLUMN     "proSource" "ProSource",
ADD COLUMN     "verificationFailuresThisMonth" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "PointsHistory_userId_groupId_reason_idx" ON "PointsHistory"("userId", "groupId", "reason");

-- AddForeignKey
ALTER TABLE "PointsHistory" ADD CONSTRAINT "PointsHistory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
