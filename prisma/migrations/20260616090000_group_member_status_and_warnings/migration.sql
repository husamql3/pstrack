-- CreateEnum
CREATE TYPE "GroupMemberStatus" AS ENUM ('ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "GroupMemberRemovalReason" AS ENUM ('AUTO_INACTIVITY', 'ADMIN_REMOVED', 'LEFT_GROUP');

-- CreateEnum
CREATE TYPE "WarningResolution" AS ENUM ('SOLVED_OR_PAUSED', 'AUTO_REMOVED', 'ADMIN_REMOVED', 'LEFT_GROUP');

-- AlterTable
ALTER TABLE "GroupMember"
ADD COLUMN "status" "GroupMemberStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "removedAt" TIMESTAMP(3),
ADD COLUMN "removalReason" "GroupMemberRemovalReason";

-- CreateTable
CREATE TABLE "GroupMemberWarning" (
    "id" TEXT NOT NULL,
    "groupMemberId" TEXT NOT NULL,
    "warningMissedCount" INTEGER NOT NULL,
    "warnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" "WarningResolution",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupMemberWarning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupMember_groupId_status_idx" ON "GroupMember"("groupId", "status");

-- CreateIndex
CREATE INDEX "GroupMemberWarning_groupMemberId_resolvedAt_idx" ON "GroupMemberWarning"("groupMemberId", "resolvedAt");

-- AddForeignKey
ALTER TABLE "GroupMemberWarning" ADD CONSTRAINT "GroupMemberWarning_groupMemberId_fkey" FOREIGN KEY ("groupMemberId") REFERENCES "GroupMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
