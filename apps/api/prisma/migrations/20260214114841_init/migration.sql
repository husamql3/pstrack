-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "ProblemSource" AS ENUM ('leetcode', 'codeforces');

-- CreateEnum
CREATE TYPE "ProblemTopic" AS ENUM ('arrays-hashing', 'two-pointers', 'sliding-window', 'stack', 'binary-search', 'linked-list', 'tree', 'priority-queue', 'backtracking', 'tries', 'graphs', '1d-dp', '2d-dp');

-- CreateEnum
CREATE TYPE "GroupPlatform" AS ENUM ('leetcode', 'codeforces');

-- CreateEnum
CREATE TYPE "ProblemDifficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "PauseStatus" AS ENUM ('approved', 'rejected');

-- CreateEnum
CREATE TYPE "PauseCategory" AS ENUM ('vacation', 'illness', 'emergency', 'personal', 'other');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" VARCHAR(50),
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "leetcode_handle" VARCHAR(50),
    "codeforces_handle" VARCHAR(50),
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_solve_date" TIMESTAMP(3),
    "pauses_used_this_month" INTEGER NOT NULL DEFAULT 0,
    "last_pause_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unexcused_miss_count" INTEGER NOT NULL DEFAULT 0,
    "is_suspended" BOOLEAN NOT NULL DEFAULT false,
    "suspended_until" TIMESTAMP(3),
    "banned" BOOLEAN DEFAULT false,
    "ban_reason" TEXT,
    "ban_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,
    "impersonated_by" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "scope" TEXT,
    "password" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100),
    "description" TEXT,
    "type" "GroupType" NOT NULL DEFAULT 'public',
    "platform" "GroupPlatform" NOT NULL DEFAULT 'leetcode',
    "max_members" INTEGER NOT NULL DEFAULT 30,
    "current_member_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_member" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem" (
    "id" UUID NOT NULL,
    "title" VARCHAR(20),
    "slug" VARCHAR(100) NOT NULL,
    "difficulty" "ProblemDifficulty",
    "topics" "ProblemTopic" NOT NULL,
    "source" "ProblemSource" NOT NULL,
    "roadmap_index" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_problem" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "problem_id" UUID NOT NULL,
    "assigned_date" TIMESTAMP(3) NOT NULL,
    "slot" INTEGER NOT NULL,
    "first_solver_id" TEXT,
    "first_solve_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_solve" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "problem_id" UUID NOT NULL,
    "daily_problem_id" UUID NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "submission_url" TEXT,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "is_first_in_group" BOOLEAN NOT NULL DEFAULT false,
    "is_first_on_platform" BOOLEAN NOT NULL DEFAULT false,
    "was_early_solver" BOOLEAN NOT NULL DEFAULT false,
    "solved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_solve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pause_request" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "daily_problem_id" UUID NOT NULL,
    "category" "PauseCategory" NOT NULL,
    "reason" VARCHAR(200),
    "status" "PauseStatus" NOT NULL,
    "is_auto_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pause_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_history" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "user_solve_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_username_idx" ON "user"("username");

-- CreateIndex
CREATE INDEX "user_totalPoints_idx" ON "user"("total_points");

-- CreateIndex
CREATE INDEX "user_currentStreak_idx" ON "user"("current_streak");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("user_id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "group_createdById_idx" ON "group"("created_by_id");

-- CreateIndex
CREATE INDEX "group_isActive_idx" ON "group"("is_active");

-- CreateIndex
CREATE INDEX "groupMember_groupId_idx" ON "group_member"("group_id");

-- CreateIndex
CREATE INDEX "groupMember_userId_idx" ON "group_member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "groupMember_unique_idx" ON "group_member"("group_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "problem_slug_key" ON "problem"("slug");

-- CreateIndex
CREATE INDEX "problem_slug_idx" ON "problem"("slug");

-- CreateIndex
CREATE INDEX "problem_difficulty_idx" ON "problem"("difficulty");

-- CreateIndex
CREATE INDEX "dailyProblem_groupId_idx" ON "daily_problem"("group_id");

-- CreateIndex
CREATE INDEX "dailyProblem_assignedDate_idx" ON "daily_problem"("assigned_date");

-- CreateIndex
CREATE UNIQUE INDEX "dailyProblem_group_date_slot_idx" ON "daily_problem"("group_id", "assigned_date", "slot");

-- CreateIndex
CREATE INDEX "userSolve_userId_idx" ON "user_solve"("user_id");

-- CreateIndex
CREATE INDEX "userSolve_dailyProblemId_idx" ON "user_solve"("daily_problem_id");

-- CreateIndex
CREATE INDEX "userSolve_solvedAt_idx" ON "user_solve"("solved_at");

-- CreateIndex
CREATE UNIQUE INDEX "userSolve_unique_idx" ON "user_solve"("user_id", "daily_problem_id");

-- CreateIndex
CREATE INDEX "pauseRequest_userId_idx" ON "pause_request"("user_id");

-- CreateIndex
CREATE INDEX "pauseRequest_dailyProblemId_idx" ON "pause_request"("daily_problem_id");

-- CreateIndex
CREATE INDEX "pauseRequest_status_idx" ON "pause_request"("status");

-- CreateIndex
CREATE INDEX "pointsHistory_userId_idx" ON "points_history"("user_id");

-- CreateIndex
CREATE INDEX "pointsHistory_createdAt_idx" ON "points_history"("created_at");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group" ADD CONSTRAINT "group_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_problem" ADD CONSTRAINT "daily_problem_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_problem" ADD CONSTRAINT "daily_problem_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_problem" ADD CONSTRAINT "daily_problem_first_solver_id_fkey" FOREIGN KEY ("first_solver_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_solve" ADD CONSTRAINT "user_solve_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_solve" ADD CONSTRAINT "user_solve_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_solve" ADD CONSTRAINT "user_solve_daily_problem_id_fkey" FOREIGN KEY ("daily_problem_id") REFERENCES "daily_problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pause_request" ADD CONSTRAINT "pause_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pause_request" ADD CONSTRAINT "pause_request_daily_problem_id_fkey" FOREIGN KEY ("daily_problem_id") REFERENCES "daily_problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_history" ADD CONSTRAINT "points_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_history" ADD CONSTRAINT "points_history_user_solve_id_fkey" FOREIGN KEY ("user_solve_id") REFERENCES "user_solve"("id") ON DELETE SET NULL ON UPDATE CASCADE;
