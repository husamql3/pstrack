CREATE TYPE "JobRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "job_run" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "JobRunStatus" NOT NULL DEFAULT 'RUNNING',
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_run_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_run_jobName_idempotencyKey_key"
    ON "job_run"("jobName", "idempotencyKey");
CREATE INDEX "job_run_status_startedAt_idx" ON "job_run"("status", "startedAt");
CREATE INDEX "job_run_createdAt_idx" ON "job_run"("createdAt");
