-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "SolveStatus" AS ENUM ('PENDING_VERIFICATION', 'SOLVED', 'PAUSED', 'MISSED', 'VERIFICATION_FAILED');

-- CreateEnum
CREATE TYPE "PointReason" AS ENUM ('DAILY_SOLVE', 'FIRST_IN_GROUP', 'STREAK_MULTIPLIER_BONUS', 'MISSED_DAY', 'ADMIN_ADJUSTMENT');

-- AlterTable
ALTER TABLE "user" ADD COLUMN "leetcodeHandle" TEXT;
ALTER TABLE "user" ADD COLUMN "codeforcesHandle" TEXT;
ALTER TABLE "user" ADD COLUMN "bio" TEXT;
ALTER TABLE "user" ADD COLUMN "twitterHandle" TEXT;
ALTER TABLE "user" ADD COLUMN "linkedinHandle" TEXT;
ALTER TABLE "user" ADD COLUMN "websiteUrl" TEXT;
ALTER TABLE "user" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN "isPro" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN "totalPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user" ADD COLUMN "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user" ADD COLUMN "longestStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user" ADD COLUMN "pausesUsedThisMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user" ADD COLUMN "notifyDailyProblem" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN "notifyAchievements" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN "notifyGroupActivity" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "GroupType" NOT NULL DEFAULT 'PUBLIC',
    "creatorId" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 30,
    "inviteCode" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupJoinRequest" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "topics" TEXT[],
    "roadmapIndex" INTEGER NOT NULL,
    "leetcodeId" INTEGER,
    "codeforcesId" TEXT,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyProblem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "assignedDate" DATE NOT NULL,
    "firstSolverId" TEXT,
    "firstSolveTime" TIMESTAMP(3),

    CONSTRAINT "DailyProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSolve" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyProblemId" TEXT NOT NULL,
    "status" "SolveStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "isFirstInGroup" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSolve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userSolveId" TEXT,
    "delta" INTEGER NOT NULL,
    "reason" "PointReason" NOT NULL,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_totalPoints_idx" ON "user"("totalPoints");

-- CreateIndex
CREATE INDEX "user_currentStreak_idx" ON "user"("currentStreak");

-- CreateIndex
CREATE UNIQUE INDEX "Group_inviteCode_key" ON "Group"("inviteCode");

-- CreateIndex
CREATE INDEX "Group_type_isActive_idx" ON "Group"("type", "isActive");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "GroupJoinRequest_status_expiresAt_idx" ON "GroupJoinRequest"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "GroupJoinRequest_groupId_userId_key" ON "GroupJoinRequest"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_slug_key" ON "Problem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_roadmapIndex_key" ON "Problem"("roadmapIndex");

-- CreateIndex
CREATE INDEX "DailyProblem_assignedDate_idx" ON "DailyProblem"("assignedDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyProblem_groupId_assignedDate_key" ON "DailyProblem"("groupId", "assignedDate");

-- CreateIndex
CREATE INDEX "UserSolve_userId_idx" ON "UserSolve"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSolve_userId_dailyProblemId_key" ON "UserSolve"("userId", "dailyProblemId");

-- CreateIndex
CREATE INDEX "PointsHistory_userId_createdAt_idx" ON "PointsHistory"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyProblem" ADD CONSTRAINT "DailyProblem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyProblem" ADD CONSTRAINT "DailyProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyProblem" ADD CONSTRAINT "DailyProblem_firstSolverId_fkey" FOREIGN KEY ("firstSolverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSolve" ADD CONSTRAINT "UserSolve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSolve" ADD CONSTRAINT "UserSolve_dailyProblemId_fkey" FOREIGN KEY ("dailyProblemId") REFERENCES "DailyProblem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsHistory" ADD CONSTRAINT "PointsHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsHistory" ADD CONSTRAINT "PointsHistory_userSolveId_fkey" FOREIGN KEY ("userSolveId") REFERENCES "UserSolve"("id") ON DELETE SET NULL ON UPDATE CASCADE;
