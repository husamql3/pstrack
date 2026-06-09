-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('STREAK_7', 'STREAK_30', 'STREAK_100', 'FIRST_SOLVER_10', 'FIRST_SOLVER_50', 'CONSISTENT_30');

-- CreateTable
CREATE TABLE "user_badge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BadgeType" NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_badge_userId_idx" ON "user_badge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badge_userId_type_key" ON "user_badge"("userId", "type");

-- AddForeignKey
ALTER TABLE "user_badge" ADD CONSTRAINT "user_badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
