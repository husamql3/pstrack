-- CreateEnum
CREATE TYPE "ProblemSource" AS ENUM ('NEETCODE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AdminAuditAction" AS ENUM ('USER_BANNED', 'USER_UNBANNED', 'POINTS_ADJUSTED', 'PRO_GRANTED', 'PRO_REVOKED', 'USER_IMPERSONATED', 'USER_IMPERSONATION_ENDED', 'GROUP_DELETED', 'GROUP_FROZEN', 'GROUP_UNFROZEN', 'PROBLEM_CREATED', 'PROBLEM_UPDATED', 'PROBLEM_DELETED', 'PROBLEMS_RESEEDED', 'FEATURE_FLAG_TOGGLED', 'SYSTEM_CONFIG_UPDATED', 'EMAIL_SENT');

-- CreateEnum
CREATE TYPE "AdminAuditTargetType" AS ENUM ('USER', 'GROUP', 'PROBLEM', 'FEATURE_FLAG', 'SYSTEM_CONFIG', 'EMAIL');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "frozen" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "source" "ProblemSource" NOT NULL DEFAULT 'NEETCODE';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "proExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "AdminAuditAction" NOT NULL,
    "targetType" "AdminAuditTargetType",
    "targetId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flag" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flag_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "system_config" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "admin_audit_log_adminId_createdAt_idx" ON "admin_audit_log"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_log_targetType_targetId_createdAt_idx" ON "admin_audit_log"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_log_action_createdAt_idx" ON "admin_audit_log"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
