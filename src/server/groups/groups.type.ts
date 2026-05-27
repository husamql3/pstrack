import { z } from "zod"

import type { Prisma } from "@/generated/prisma/client"

export const groupListSelect = {
	id: true,
	name: true,
	description: true,
	type: true,
	maxMembers: true,
	createdAt: true,
	_count: {
		select: {
			members: true,
		},
	},
} as const

export type GroupListResponse = Prisma.GroupGetPayload<{
	select: typeof groupListSelect
}> & {
	membershipStatus: "JOINED" | "REQUESTED" | "NONE"
}

export const createGroupSchema = z.object({
	name: z.string({ error: "Name is required" }).min(3, "Name is required"),
	description: z.string().max(240).optional(),
})

export type CreateGroupFormInput = z.infer<typeof createGroupSchema>

export const groupDetailSelect = {
	id: true,
	name: true,
	description: true,
	type: true,
	maxMembers: true,
	inviteCode: true,
	inviteExpiresAt: true,
	creatorId: true,
	createdAt: true,
	_count: { select: { members: true } },
} as const

export type GroupDetailResponse = Prisma.GroupGetPayload<{
	select: typeof groupDetailSelect
}> & {
	membershipStatus: "JOINED" | "REQUESTED" | "NONE"
	userRole: "ADMIN" | "MEMBER" | null
}

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
} as const

export type GroupMemberResponse = Prisma.GroupMemberGetPayload<{
	select: typeof groupMemberSelect
}>

export const joinRequestSelect = {
	id: true,
	status: true,
	createdAt: true,
	expiresAt: true,
	user: {
		select: { id: true, username: true, name: true },
	},
} as const

export type JoinRequestResponse = Prisma.GroupJoinRequestGetPayload<{
	select: typeof joinRequestSelect
}>

export const updateGroupSchema = z.object({
	name: z
		.string({ error: "Name is required" })
		.min(3, "Name must be at least 3 characters")
		.optional(),
	description: z.string().max(240).optional().nullable(),
})

export type UpdateGroupFormInput = z.infer<typeof updateGroupSchema>

export const generateInviteSchema = z.object({
	expiresIn: z.enum(["7d", "30d", "90d", "never"]),
})

export type GenerateInviteInput = z.infer<typeof generateInviteSchema>
