CREATE TYPE "public"."group_member_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."group_platform" AS ENUM('leetcode', 'codeforces');--> statement-breakpoint
CREATE TYPE "public"."group_type" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."pause_category" AS ENUM('vacation', 'illness', 'emergency', 'personal', 'other');--> statement-breakpoint
CREATE TYPE "public"."pause_status" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."problem_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."problem_source" AS ENUM('leetcode', 'codeforces');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_problem" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"problem_id" text NOT NULL,
	"assigned_date" timestamp NOT NULL,
	"slot" integer NOT NULL,
	"first_solver_id" text,
	"first_solve_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"type" "group_type" NOT NULL,
	"platform" "group_platform" DEFAULT 'leetcode' NOT NULL,
	"max_members" integer DEFAULT 30 NOT NULL,
	"current_member_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_member" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "group_member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pause_request" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"daily_problem_id" text NOT NULL,
	"category" "pause_category" NOT NULL,
	"reason" varchar(200),
	"status" "pause_status" NOT NULL,
	"is_auto_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"reason" varchar(200) NOT NULL,
	"user_solve_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"difficulty" "problem_difficulty",
	"source" "problem_source" NOT NULL,
	"roadmap_index" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "problem_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"leetcode_handle" varchar(50) NOT NULL,
	"codeforces_handle" varchar(50),
	"total_points" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_solve_date" timestamp,
	"pauses_used_this_month" integer DEFAULT 0 NOT NULL,
	"last_pause_reset" timestamp DEFAULT now() NOT NULL,
	"unexcused_miss_count" integer DEFAULT 0 NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"suspended_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_solve" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"problem_id" text NOT NULL,
	"daily_problem_id" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"submission_url" text,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"is_first_in_group" boolean DEFAULT false NOT NULL,
	"is_first_on_platform" boolean DEFAULT false NOT NULL,
	"was_early_solver" boolean DEFAULT false NOT NULL,
	"solved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_problem" ADD CONSTRAINT "daily_problem_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_problem" ADD CONSTRAINT "daily_problem_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_problem" ADD CONSTRAINT "daily_problem_first_solver_id_user_id_fk" FOREIGN KEY ("first_solver_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group" ADD CONSTRAINT "group_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pause_request" ADD CONSTRAINT "pause_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pause_request" ADD CONSTRAINT "pause_request_daily_problem_id_daily_problem_id_fk" FOREIGN KEY ("daily_problem_id") REFERENCES "public"."daily_problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_history" ADD CONSTRAINT "points_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_history" ADD CONSTRAINT "points_history_user_solve_id_user_solve_id_fk" FOREIGN KEY ("user_solve_id") REFERENCES "public"."user_solve"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_solve" ADD CONSTRAINT "user_solve_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_solve" ADD CONSTRAINT "user_solve_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_solve" ADD CONSTRAINT "user_solve_daily_problem_id_daily_problem_id_fk" FOREIGN KEY ("daily_problem_id") REFERENCES "public"."daily_problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dailyProblem_groupId_idx" ON "daily_problem" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "dailyProblem_assignedDate_idx" ON "daily_problem" USING btree ("assigned_date");--> statement-breakpoint
CREATE UNIQUE INDEX "dailyProblem_group_date_slot_idx" ON "daily_problem" USING btree ("group_id","assigned_date","slot");--> statement-breakpoint
CREATE INDEX "group_platform_idx" ON "group" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "group_createdById_idx" ON "group" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "group_isActive_idx" ON "group" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "groupMember_groupId_idx" ON "group_member" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "groupMember_userId_idx" ON "group_member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "groupMember_unique_idx" ON "group_member" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "pauseRequest_userId_idx" ON "pause_request" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pauseRequest_dailyProblemId_idx" ON "pause_request" USING btree ("daily_problem_id");--> statement-breakpoint
CREATE INDEX "pauseRequest_status_idx" ON "pause_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pointsHistory_userId_idx" ON "points_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pointsHistory_createdAt_idx" ON "points_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "problem_slug_idx" ON "problem" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "problem_difficulty_idx" ON "problem" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_username_idx" ON "user" USING btree ("username");--> statement-breakpoint
CREATE INDEX "user_totalPoints_idx" ON "user" USING btree ("total_points");--> statement-breakpoint
CREATE INDEX "user_currentStreak_idx" ON "user" USING btree ("current_streak");--> statement-breakpoint
CREATE INDEX "userSolve_userId_idx" ON "user_solve" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "userSolve_dailyProblemId_idx" ON "user_solve" USING btree ("daily_problem_id");--> statement-breakpoint
CREATE INDEX "userSolve_solvedAt_idx" ON "user_solve" USING btree ("solved_at");--> statement-breakpoint
CREATE UNIQUE INDEX "userSolve_unique_idx" ON "user_solve" USING btree ("user_id","daily_problem_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");