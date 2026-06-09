import { z } from "zod"

import type { Prisma } from "@/generated/prisma/client"
import {
	AdminAuditAction,
	AdminAuditTargetType,
	GroupType,
	PointReason,
	ProSource,
	Roadmap,
} from "@/generated/prisma/enums"

// ─── Pagination (shared by every admin list endpoint) ─────────────────────────

export const ADMIN_LIST_LIMIT_DEFAULT = 50
export const ADMIN_LIST_LIMIT_MAX = 200

export type PaginatedResponse<T> = {
	items: T[]
	nextCursor: string | null
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export const adminAuditLogSelect = {
	id: true,
	adminId: true,
	action: true,
	targetType: true,
	targetId: true,
	metadata: true,
	createdAt: true,
	admin: {
		select: {
			id: true,
			username: true,
			name: true,
			email: true,
		},
	},
} satisfies Prisma.AdminAuditLogSelect

export type AdminAuditLogResponse = Prisma.AdminAuditLogGetPayload<{
	select: typeof adminAuditLogSelect
}>

export type AdminAuditTarget = {
	type: AdminAuditTargetType
	id: string
}

export type AdminAuditWriteInput = {
	adminId: string
	action: AdminAuditAction
	target?: AdminAuditTarget
	metadata?: Prisma.JsonObject
}

// ─── User admin ───────────────────────────────────────────────────────────────

export const adminUserListSelect = {
	id: true,
	name: true,
	username: true,
	email: true,
	role: true,
	banned: true,
	banReason: true,
	banExpires: true,
	isPro: true,
	proSource: true,
	proExpiresAt: true,
	totalPoints: true,
	currentStreak: true,
	createdAt: true,
} satisfies Prisma.UserSelect

export type AdminUserListItem = Prisma.UserGetPayload<{
	select: typeof adminUserListSelect
}>

export const adminUserDetailSelect = {
	...adminUserListSelect,
	emailVerified: true,
	leetcodeHandle: true,
	codeforcesHandle: true,
	bio: true,
	longestStreak: true,
	pausesUsedThisMonth: true,
	verificationFailuresThisMonth: true,
	currentStreakStartedAt: true,
	notifyDailyProblem: true,
	notifyAchievements: true,
	notifyGroupActivity: true,
	updatedAt: true,
	groupMemberships: {
		select: {
			id: true,
			role: true,
			joinedAt: true,
			group: { select: { id: true, slug: true, type: true } },
		},
	},
} satisfies Prisma.UserSelect

export type AdminUserDetailResponse = Prisma.UserGetPayload<{
	select: typeof adminUserDetailSelect
}>

export const adminUserPointsHistorySelect = {
	id: true,
	delta: true,
	reason: true,
	adminNote: true,
	createdAt: true,
	groupId: true,
	userSolveId: true,
} satisfies Prisma.PointsHistorySelect

export type AdminUserPointsHistoryItem = Prisma.PointsHistoryGetPayload<{
	select: typeof adminUserPointsHistorySelect
}>

// ─── Group admin ──────────────────────────────────────────────────────────────

export const adminGroupListSelect = {
	id: true,
	slug: true,
	type: true,
	roadmap: true,
	creatorId: true,
	maxMembers: true,
	isActive: true,
	frozen: true,
	createdAt: true,
	_count: { select: { members: true, dailyProblems: true } },
} satisfies Prisma.GroupSelect

export type AdminGroupListItem = Prisma.GroupGetPayload<{
	select: typeof adminGroupListSelect
}>

export const adminGroupDetailSelect = {
	id: true,
	slug: true,
	type: true,
	roadmap: true,
	creatorId: true,
	maxMembers: true,
	isActive: true,
	frozen: true,
	inviteCode: true,
	inviteExpiresAt: true,
	createdAt: true,
	_count: { select: { members: true, joinRequests: true } },
} satisfies Prisma.GroupSelect

export type AdminGroupDetailResponse = Prisma.GroupGetPayload<{
	select: typeof adminGroupDetailSelect
}>

export const adminPendingJoinRequestSelect = {
	id: true,
	groupId: true,
	createdAt: true,
	expiresAt: true,
	user: { select: { id: true, username: true, name: true } },
	group: { select: { id: true, slug: true } },
} satisfies Prisma.GroupJoinRequestSelect

export type AdminPendingJoinRequestResponse = Prisma.GroupJoinRequestGetPayload<{
	select: typeof adminPendingJoinRequestSelect
}>

// ─── Problem admin ────────────────────────────────────────────────────────────

export const adminProblemListSelect = {
	id: true,
	slug: true,
	title: true,
	difficulty: true,
	topic: true,
	roadmapIndex: true,
	leetcodeId: true,
	neetcode250: true,
	neetcode150: true,
	blind75: true,
	source: true,
} satisfies Prisma.ProblemSelect

export type AdminProblemListItem = Prisma.ProblemGetPayload<{
	select: typeof adminProblemListSelect
}>

// ─── Feature flags ────────────────────────────────────────────────────────────

export const featureFlagSelect = {
	key: true,
	enabled: true,
	description: true,
	updatedAt: true,
	createdAt: true,
} satisfies Prisma.FeatureFlagSelect

export type FeatureFlagResponse = Prisma.FeatureFlagGetPayload<{
	select: typeof featureFlagSelect
}>

// ─── System config ────────────────────────────────────────────────────────────

export const systemConfigSelect = {
	key: true,
	value: true,
	description: true,
	updatedAt: true,
	createdAt: true,
} satisfies Prisma.SystemConfigSelect

export type SystemConfigResponse = Prisma.SystemConfigGetPayload<{
	select: typeof systemConfigSelect
}>

// ─── Stats ────────────────────────────────────────────────────────────────────

export type AdminStatsResponse = {
	totals: {
		users: number
		activeUsers7d: number
		groups: number
		solvesToday: number
		proUsers: number
		signupsToday: number
	}
	signups30d: Array<{ date: string; count: number }>
}

// ─── Zod (client form schemas) ────────────────────────────────────────────────

export const adminAdjustPointsSchema = z.object({
	delta: z
		.number()
		.int()
		.refine((v) => v !== 0, { error: "Delta cannot be zero" }),
	reason: z
		.string()
		.trim()
		.min(1, { error: "Reason is required" })
		.max(280, { error: "Reason must be 280 characters or fewer" }),
})
export type AdminAdjustPointsInput = z.infer<typeof adminAdjustPointsSchema>

export const adminProGrantSchema = z.object({
	grant: z.boolean(),
	expiresAt: z
		.string()
		.datetime({ error: "Must be a valid ISO datetime" })
		.nullable()
		.optional(),
	reason: z
		.string()
		.trim()
		.min(1, { error: "Reason is required" })
		.max(280, { error: "Reason must be 280 characters or fewer" }),
})
export type AdminProGrantInput = z.infer<typeof adminProGrantSchema>

export const adminBanUserSchema = z.object({
	banned: z.boolean(),
	reason: z
		.string()
		.trim()
		.max(280, { error: "Reason must be 280 characters or fewer" })
		.optional(),
})
export type AdminBanUserInput = z.infer<typeof adminBanUserSchema>

export const adminCreateGroupSchema = z.object({
	type: z.enum(GroupType),
	roadmap: z.enum(Roadmap),
	maxMembers: z.number().int().min(2).max(50),
})
export type AdminCreateGroupInput = z.infer<typeof adminCreateGroupSchema>

export const adminProblemFormSchema = z.object({
	slug: z.string().trim().min(1, { error: "Slug is required" }).max(120),
	title: z.string().trim().min(1, { error: "Title is required" }).max(200),
	difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
	topic: z.string().trim().min(1).max(80),
	leetcodeId: z.number().int().positive().nullable().optional(),
	neetcode250: z.boolean().default(false),
	neetcode150: z.boolean().default(false),
	blind75: z.boolean().default(false),
})
export type AdminProblemFormInput = z.infer<typeof adminProblemFormSchema>

export const adminEmailSendSchema = z.object({
	template: z.string().trim().min(1),
	toUserId: z.string().trim().min(1, { error: "Recipient is required" }),
	props: z.record(z.string(), z.unknown()).default({}),
})
export type AdminEmailSendInput = z.infer<typeof adminEmailSendSchema>

// ─── Re-exports ───────────────────────────────────────────────────────────────

export {
	AdminAuditAction,
	AdminAuditTargetType,
	GroupType,
	PointReason,
	ProSource,
	Roadmap,
}
