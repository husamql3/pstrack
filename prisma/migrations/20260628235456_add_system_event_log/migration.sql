-- CreateEnum
CREATE TYPE "SystemEventType" AS ENUM ('SOLVE_VERIFIED', 'SOLVE_FAILED', 'PAUSE_USED', 'MISS_BATCH', 'USERNAME_CHANGED', 'HANDLE_CHANGED', 'GROUP_CREATED', 'GROUP_JOINED', 'GROUP_LEFT', 'MEMBER_REMOVED', 'JOIN_REQUEST_SENT', 'JOIN_REQUEST_APPROVED', 'JOIN_REQUEST_REJECTED');

-- CreateEnum
CREATE TYPE "SystemEventTargetType" AS ENUM ('USER', 'GROUP', 'SOLVE');

-- CreateTable
CREATE TABLE "system_event_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorUsername" TEXT,
    "actorName" TEXT,
    "eventType" "SystemEventType" NOT NULL,
    "targetType" "SystemEventTargetType",
    "targetId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_event_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_event_log_actorId_createdAt_idx" ON "system_event_log"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "system_event_log_eventType_createdAt_idx" ON "system_event_log"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "system_event_log_targetType_targetId_createdAt_idx" ON "system_event_log"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "system_event_log_createdAt_idx" ON "system_event_log"("createdAt");
