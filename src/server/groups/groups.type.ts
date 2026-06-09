import { z } from "zod"

import type { Prisma } from "@/generated/prisma/client"
import type { Difficulty, SolveStatus } from "@/generated/prisma/enums"

// ─── List ─────────────────────────────────────────────────────────────────────

export const groupListSelect = {
	id: true,
	slug: true,
	type: true,
	roadmap: true,
	maxMembers: true,
	createdAt: true,
	_count: {
		select: {
			members: true,
		},
	},
} satisfies Prisma.GroupSelect

type GroupListBase = Prisma.GroupGetPayload<{ select: typeof groupListSelect }>

export type GroupListResponse = GroupListBase & {
	membershipStatus: "JOINED" | "REQUESTED" | "NONE"
	memberPreview: { username: string | null }[]
	activeToday: number
	currentProblem: { topic: string } | null
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export const groupDetailSelect = {
	id: true,
	slug: true,
	type: true,
	maxMembers: true,
	inviteCode: true,
	inviteExpiresAt: true,
	creatorId: true,
	createdAt: true,
	_count: { select: { members: true } },
} satisfies Prisma.GroupSelect

export type GroupDetailResponse = Prisma.GroupGetPayload<{
	select: typeof groupDetailSelect
}> & {
	membershipStatus: "JOINED" | "REQUESTED" | "NONE"
	userRole: "ADMIN" | "MEMBER" | null
}

// ─── Members ──────────────────────────────────────────────────────────────────

export const groupMemberSelect = {
	id: true,
	role: true,
	joinedAt: true,
	user: {
		select: {
			id: true,
			username: true,
			name: true,
			totalPoints: true,
			currentStreak: true,
		},
	},
} satisfies Prisma.GroupMemberSelect

export type GroupMemberResponse = Prisma.GroupMemberGetPayload<{
	select: typeof groupMemberSelect
}>

// ─── Join requests ────────────────────────────────────────────────────────────

export const joinRequestSelect = {
	id: true,
	status: true,
	createdAt: true,
	expiresAt: true,
	user: {
		select: { id: true, username: true, name: true },
	},
} satisfies Prisma.GroupJoinRequestSelect

export type JoinRequestResponse = Prisma.GroupJoinRequestGetPayload<{
	select: typeof joinRequestSelect
}>

// ─── Forms ────────────────────────────────────────────────────────────────────

export const createGroupSchema = z.object({})

export type CreateGroupFormInput = z.infer<typeof createGroupSchema>

// ─── Today's activity ─────────────────────────────────────────────────────────

type ActivityBase = { userId: string; username: string | null; name: string; at: Date }

export type GroupActivityEvent =
	| (ActivityBase & {
			type: "SOLVED" | "FIRST_SOLVE"
			problemTitle: string
			problemRoadmapIndex: number
	  })
	| (ActivityBase & { type: "PAUSED" })
	| (ActivityBase & { type: "JOINED"; groupSlug: string })

export type GroupTodayActivityResponse = {
	events: GroupActivityEvent[]
}

// ─── Problems table ───────────────────────────────────────────────────────────

export type GroupProblemsRange = "7d" | "30d" | "all"

export const GROUP_PROBLEMS_PAGE_SIZE = 30

export type GroupProblemsCellSolve = {
	status: SolveStatus
	pointsEarned: number
	isFirstInGroup: boolean
	verifiedAt: Date | null
}

export type GroupProblemsRow = {
	dailyProblemId: string
	assignedDate: Date
	problemId: string
	problemSlug: string
	problemTitle: string
	problemLeetcodeId: number | null
	problemDifficulty: Difficulty
	problemTopic: string
	problemRoadmapIndex: number
	solvesByUserId: Record<string, GroupProblemsCellSolve>
}

export type GroupProblemsMember = {
	userId: string
	username: string | null
	name: string
	joinedAt: Date
	isPro: boolean
	solvedInRange: number
	totalAssignedInRange: number
}

export type GroupProblemsResponse = {
	members: GroupProblemsMember[]
	rows: GroupProblemsRow[]
	nextCursor: string | null
}
