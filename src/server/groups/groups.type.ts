import { z } from "zod"

import type { Prisma } from "@/generated/prisma/client"

// ─── List ─────────────────────────────────────────────────────────────────────

export const groupListSelect = {
	id: true,
	slug: true,
	type: true,
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

export const generateInviteSchema = z.object({
	expiresIn: z.enum(["7d", "30d", "90d", "never"]),
})

export type GenerateInviteInput = z.infer<typeof generateInviteSchema>
