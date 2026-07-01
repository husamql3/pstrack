-- CreateEnum
CREATE TYPE "FeedbackSource" AS ENUM ('GROUP_PROMPT', 'GENERAL');

-- AlterTable
ALTER TABLE "feedback" ADD COLUMN     "source" "FeedbackSource" NOT NULL DEFAULT 'GROUP_PROMPT',
ALTER COLUMN "groupId" DROP NOT NULL,
ALTER COLUMN "category" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "feedback_source_idx" ON "feedback"("source");
