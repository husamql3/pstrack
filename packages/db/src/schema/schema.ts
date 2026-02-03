import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, pgEnum, integer, varchar, uniqueIndex } from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const UserRole = ["admin", "user"] as const;
export type UserRole = (typeof UserRole)[number];
export const userRoleEnum = pgEnum("user_role", UserRole);

export const GroupType = ["public", "private"] as const;
export type GroupType = (typeof GroupType)[number];
export const groupTypeEnum = pgEnum("group_type", GroupType);

export const GroupMemberRole = ["admin", "member"] as const;
export type GroupMemberRole = (typeof GroupMemberRole)[number];
export const groupMemberRoleEnum = pgEnum("group_member_role", GroupMemberRole);

export const ProblemSource = ["leetcode", "codeforces"] as const;
export type ProblemSource = (typeof ProblemSource)[number];
export const problemSourceEnum = pgEnum("problem_source", ProblemSource);
export const GroupPlatform = ["leetcode", "codeforces"] as const;
export type GroupPlatform = (typeof GroupPlatform)[number];
export const groupPlatformEnum = pgEnum("group_platform", GroupPlatform);

export const ProblemDifficulty = ["easy", "medium", "hard"] as const;
export type ProblemDifficulty = (typeof ProblemDifficulty)[number];
export const problemDifficultyEnum = pgEnum("problem_difficulty", ProblemDifficulty);

export const PauseStatus = ["approved", "rejected"] as const;
export type PauseStatus = (typeof PauseStatus)[number];
export const pauseStatusEnum = pgEnum("pause_status", PauseStatus);

export const PauseCategory = ["vacation", "illness", "emergency", "personal", "other"] as const;
export type PauseCategory = (typeof PauseCategory)[number];
export const pauseCategoryEnum = pgEnum("pause_category", PauseCategory);

// ============================================================================
// USER TABLE
// ============================================================================

export const user = pgTable(
	"user",
	{
		id: text("id").primaryKey(),
		username: varchar("username", { length: 50 }).notNull().unique(),
		email: text("email").notNull().unique(),
		emailVerified: boolean("email_verified").default(false).notNull(),
		role: userRoleEnum("role").default("user").notNull(),

		leetcodeHandle: varchar("leetcode_handle", { length: 50 }).notNull(),
		codeforcesHandle: varchar("codeforces_handle", { length: 50 }),

		// Points & Streaks
		totalPoints: integer("total_points").default(0).notNull(),
		currentStreak: integer("current_streak").default(0).notNull(),
		longestStreak: integer("longest_streak").default(0).notNull(),
		lastSolveDate: timestamp("last_solve_date"),

		// Pause tracking (resets monthly)
		pausesUsedThisMonth: integer("pauses_used_this_month").default(0).notNull(),
		lastPauseReset: timestamp("last_pause_reset").defaultNow().notNull(),

		// Suspension tracking
		unexcusedMissCount: integer("unexcused_miss_count").default(0).notNull(),
		isSuspended: boolean("is_suspended").default(false).notNull(),
		suspendedUntil: timestamp("suspended_until"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("user_username_idx").on(table.username),
		index("user_totalPoints_idx").on(table.totalPoints),
		index("user_currentStreak_idx").on(table.currentStreak),
	],
);

// ============================================================================
// GROUP TABLE
// ============================================================================

export const group = pgTable(
	"group",
	{
		id: text("id").primaryKey(),
		name: varchar("name", { length: 100 }).notNull(),
		description: text("description"),
		type: groupTypeEnum("type").notNull(),
		platform: groupPlatformEnum("platform").notNull().default("leetcode"),

		// Settings
		maxMembers: integer("max_members").default(30).notNull(),
		currentMemberCount: integer("current_member_count").default(0).notNull(),
		isActive: boolean("is_active").default(true).notNull(),

		banned: boolean("banned").default(false),
		banReason: text("ban_reason"),
		banExpires: timestamp("ban_expires"),

		createdById: text("created_by_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("group_platform_idx").on(table.platform),
		index("group_createdById_idx").on(table.createdById),
		index("group_isActive_idx").on(table.isActive),
	],
);

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		impersonatedBy: text("impersonated_by"),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ============================================================================
// GROUP_MEMBER TABLE
// ============================================================================

export const groupMember = pgTable(
	"group_member",
	{
		id: text("id").primaryKey(),
		groupId: text("group_id")
			.notNull()
			.references(() => group.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: groupMemberRoleEnum("role").default("member").notNull(),
		joinedAt: timestamp("joined_at").defaultNow().notNull(),
	},
	(table) => [
		index("groupMember_groupId_idx").on(table.groupId),
		index("groupMember_userId_idx").on(table.userId),
		uniqueIndex("groupMember_unique_idx").on(table.groupId, table.userId),
	],
);

// ============================================================================
// PROBLEM TABLE
// ============================================================================

export const problem = pgTable(
	"problem",
	{
		id: text("id").primaryKey(),
		title: varchar("title", { length: 200 }).notNull(),
		slug: varchar("slug", { length: 200 }).notNull().unique(),
		difficulty: problemDifficultyEnum("difficulty"),
		source: problemSourceEnum("source").notNull(),
		roadmapIndex: integer("roadmap_index"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("problem_slug_idx").on(table.slug), index("problem_difficulty_idx").on(table.difficulty)],
);

// ============================================================================
// DAILY_PROBLEM TABLE
// ============================================================================

export const dailyProblem = pgTable(
	"daily_problem",
	{
		id: text("id").primaryKey(),
		groupId: text("group_id")
			.notNull()
			.references(() => group.id, { onDelete: "cascade" }),
		problemId: text("problem_id")
			.notNull()
			.references(() => problem.id, { onDelete: "cascade" }),
		assignedDate: timestamp("assigned_date").notNull(), // date when problem was assigned

		slot: integer("slot").notNull(), // 1 or 2, we can have 2 problems per day

		// track first solver and time
		firstSolverId: text("first_solver_id").references(() => user.id, { onDelete: "set null" }),
		firstSolveTime: timestamp("first_solve_time"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("dailyProblem_groupId_idx").on(table.groupId),
		index("dailyProblem_assignedDate_idx").on(table.assignedDate),
		// allows max 2 problems per group per day (slot 1 and 2)
		uniqueIndex("dailyProblem_group_date_slot_idx").on(table.groupId, table.assignedDate, table.slot),
	],
);

// ============================================================================
// USER_SOLVE TABLE
// ============================================================================

export const userSolve = pgTable(
	"user_solve",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		problemId: text("problem_id")
			.notNull()
			.references(() => problem.id, { onDelete: "cascade" }),
		dailyProblemId: text("daily_problem_id")
			.notNull()
			.references(() => dailyProblem.id, { onDelete: "cascade" }),

		// verification status
		isVerified: boolean("is_verified").default(false).notNull(),
		verifiedAt: timestamp("verified_at"),
		submissionUrl: text("submission_url"), // link to LeetCode/CF submission

		// points awarded
		pointsEarned: integer("points_earned").default(0).notNull(),

		// bonuses
		isFirstInGroup: boolean("is_first_in_group").default(false).notNull(),
		isFirstOnPlatform: boolean("is_first_on_platform").default(false).notNull(),
		wasEarlySolver: boolean("was_early_solver").default(false).notNull(), // Within 6 hours

		solvedAt: timestamp("solved_at").defaultNow().notNull(),
	},
	(table) => [
		index("userSolve_userId_idx").on(table.userId),
		index("userSolve_dailyProblemId_idx").on(table.dailyProblemId),
		index("userSolve_solvedAt_idx").on(table.solvedAt),
		// one solve per user per daily problem
		uniqueIndex("userSolve_unique_idx").on(table.userId, table.dailyProblemId),
	],
);

// ============================================================================
// PAUSE_REQUEST TABLE
// ============================================================================

export const pauseRequest = pgTable(
	"pause_request",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		dailyProblemId: text("daily_problem_id")
			.notNull()
			.references(() => dailyProblem.id, { onDelete: "cascade" }),

		// request details
		category: pauseCategoryEnum("category").notNull(),
		reason: varchar("reason", { length: 200 }),

		// status (only approved/rejected) (later we can add `pending`)
		status: pauseStatusEnum("status").notNull(),

		// auto-approval (first 2 pauses per month)
		isAutoApproved: boolean("is_auto_approved").default(false).notNull(),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("pauseRequest_userId_idx").on(table.userId),
		index("pauseRequest_dailyProblemId_idx").on(table.dailyProblemId),
		index("pauseRequest_status_idx").on(table.status),
	],
);

// ============================================================================
// POINTS_HISTORY TABLE
// ============================================================================

export const pointsHistory = pgTable(
	"points_history",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		amount: integer("amount").notNull(), // can be negative
		reason: varchar("reason", { length: 200 }).notNull(),

		// optional context
		userSolveId: text("user_solve_id").references(() => userSolve.id, { onDelete: "set null" }),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("pointsHistory_userId_idx").on(table.userId),
		index("pointsHistory_createdAt_idx").on(table.createdAt),
	],
);

// ============================================================================
// RELATIONS
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	groupMemberships: many(groupMember),
	groupsCreated: many(group),
	solves: many(userSolve),
	pauseRequests: many(pauseRequest),
	pointsHistory: many(pointsHistory),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const groupRelations = relations(group, ({ one, many }) => ({
	creator: one(user, {
		fields: [group.createdById],
		references: [user.id],
	}),
	members: many(groupMember),
	dailyProblems: many(dailyProblem),
}));

export const groupMemberRelations = relations(groupMember, ({ one }) => ({
	group: one(group, {
		fields: [groupMember.groupId],
		references: [group.id],
	}),
	user: one(user, {
		fields: [groupMember.userId],
		references: [user.id],
	}),
}));

export const problemRelations = relations(problem, ({ many }) => ({
	dailyProblems: many(dailyProblem),
	solves: many(userSolve),
}));

export const dailyProblemRelations = relations(dailyProblem, ({ one, many }) => ({
	group: one(group, {
		fields: [dailyProblem.groupId],
		references: [group.id],
	}),
	problem: one(problem, {
		fields: [dailyProblem.problemId],
		references: [problem.id],
	}),
	firstSolver: one(user, {
		fields: [dailyProblem.firstSolverId],
		references: [user.id],
	}),
	solves: many(userSolve),
	pauseRequests: many(pauseRequest),
}));

export const userSolveRelations = relations(userSolve, ({ one }) => ({
	user: one(user, {
		fields: [userSolve.userId],
		references: [user.id],
	}),
	problem: one(problem, {
		fields: [userSolve.problemId],
		references: [problem.id],
	}),
	dailyProblem: one(dailyProblem, {
		fields: [userSolve.dailyProblemId],
		references: [dailyProblem.id],
	}),
}));

export const pauseRequestRelations = relations(pauseRequest, ({ one }) => ({
	user: one(user, {
		fields: [pauseRequest.userId],
		references: [user.id],
	}),
	dailyProblem: one(dailyProblem, {
		fields: [pauseRequest.dailyProblemId],
		references: [dailyProblem.id],
	}),
}));

export const pointsHistoryRelations = relations(pointsHistory, ({ one }) => ({
	user: one(user, {
		fields: [pointsHistory.userId],
		references: [user.id],
	}),
	userSolve: one(userSolve, {
		fields: [pointsHistory.userSolveId],
		references: [userSolve.id],
	}),
}));
