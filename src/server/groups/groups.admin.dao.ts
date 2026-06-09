import slugsPool from "@/data/slugs.json"
import type { Prisma } from "@/generated/prisma/client"
import { PointReason } from "@/generated/prisma/enums"
import {
	type AdminGroupDetailResponse,
	type AdminGroupListItem,
	type AdminPendingJoinRequestResponse,
	adminGroupDetailSelect,
	adminGroupListSelect,
	adminPendingJoinRequestSelect,
	type PaginatedResponse,
} from "@/server/admin/admin.type"
import { adminAuditDao } from "@/server/admin/admin-audit.dao"
import { db } from "@/server/lib/db"
import { pointsDao } from "@/server/points/points.dao"
import { JOIN_GROUP_BONUS } from "@/server/points/points.type"
import {
	type GroupMemberResponse,
	groupMemberSelect,
	type JoinRequestResponse,
	joinRequestSelect,
} from "./groups.type"

type ListParams = {
	cursor?: string | null
	limit: number
	q?: string | null
	type?: "PUBLIC" | "PRIVATE" | null
	frozen?: boolean | null
	isActive?: boolean | null
	sortBy?: string | null
	sortDir?: "asc" | "desc"
}

async function pickSlug(): Promise<string> {
	const used = await db.group.findMany({
		where: { slug: { in: slugsPool as string[] } },
		select: { slug: true },
	})
	const usedSet = new Set(used.map((g) => g.slug))
	const available = (slugsPool as string[]).filter((s) => !usedSet.has(s))
	if (available.length === 0) throw new Error("Slug pool exhausted - add more slugs.")
	return available[Math.floor(Math.random() * available.length)]
}

export const groupsAdminDao = {
	create: async (
		adminId: string,
		input: {
			type: "PUBLIC" | "PRIVATE"
			roadmap: "NC250" | "NC150" | "BLIND75"
			maxMembers: number
		}
	): Promise<AdminGroupListItem> => {
		const slug = await pickSlug()
		return db.$transaction(async (tx) => {
			const created = await tx.group.create({
				data: {
					slug,
					type: input.type,
					roadmap: input.roadmap,
					maxMembers: input.maxMembers,
					isActive: true,
					creatorId: adminId,
				},
				select: { id: true, slug: true },
			})
			await adminAuditDao.log(
				{
					adminId,
					action: "GROUP_CREATED",
					target: { type: "GROUP", id: created.id },
					metadata: { slug: created.slug, type: input.type, roadmap: input.roadmap },
				},
				tx
			)
			return tx.group.findUniqueOrThrow({
				where: { id: created.id },
				select: adminGroupListSelect,
			})
		})
	},

	list: async (params: ListParams): Promise<PaginatedResponse<AdminGroupListItem>> => {
		const where: Prisma.GroupWhereInput = {}

		if (params.q) {
			const q = params.q.trim()
			if (q.length > 0) {
				where.OR = [{ slug: { contains: q, mode: "insensitive" } }]
			}
		}
		if (params.type) where.type = params.type
		if (params.frozen !== null && params.frozen !== undefined)
			where.frozen = params.frozen
		if (params.isActive !== null && params.isActive !== undefined) {
			where.isActive = params.isActive
		}

		const sortDir = params.sortDir ?? "desc"
		const orderBy: Prisma.GroupOrderByWithRelationInput = { createdAt: sortDir }

		const rows = await db.group.findMany({
			where,
			select: adminGroupListSelect,
			orderBy,
			take: params.limit + 1,
			...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
		})

		const hasMore = rows.length > params.limit
		const items = hasMore ? rows.slice(0, params.limit) : rows
		return {
			items,
			nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
		}
	},

	setFrozen: async (
		adminId: string,
		groupId: string,
		frozen: boolean
	): Promise<AdminGroupListItem> => {
		return db.$transaction(async (tx) => {
			const updated = await tx.group.update({
				where: { id: groupId },
				data: { frozen },
				select: adminGroupListSelect,
			})
			await adminAuditDao.log(
				{
					adminId,
					action: frozen ? "GROUP_FROZEN" : "GROUP_UNFROZEN",
					target: { type: "GROUP", id: groupId },
					metadata: { slug: updated.slug },
				},
				tx
			)
			return updated
		})
	},

	delete: async (
		adminId: string,
		groupId: string
	): Promise<{ ok: true; slug: string } | { ok: false; error: "GROUP_NOT_FOUND" }> => {
		const existing = await db.group.findUnique({
			where: { id: groupId },
			select: { slug: true, _count: { select: { members: true } } },
		})
		if (!existing) return { ok: false, error: "GROUP_NOT_FOUND" }

		await db.$transaction(async (tx) => {
			await tx.dailyProblem.deleteMany({ where: { groupId } })
			await tx.groupJoinRequest.deleteMany({ where: { groupId } })
			await tx.groupMember.deleteMany({ where: { groupId } })
			await tx.group.delete({ where: { id: groupId } })
			await adminAuditDao.log(
				{
					adminId,
					action: "GROUP_DELETED",
					target: { type: "GROUP", id: groupId },
					metadata: { slug: existing.slug, memberCount: existing._count.members },
				},
				tx
			)
		})

		return { ok: true, slug: existing.slug }
	},

	findById: async (groupId: string): Promise<AdminGroupDetailResponse | null> => {
		return db.group.findUnique({
			where: { id: groupId },
			select: adminGroupDetailSelect,
		})
	},

	listMembers: async (groupId: string): Promise<GroupMemberResponse[]> => {
		return db.groupMember.findMany({
			where: { groupId },
			orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
			select: groupMemberSelect,
		})
	},

	removeMember: async (groupId: string, targetUserId: string) => {
		const target = await db.groupMember.findUnique({
			where: { groupId_userId: { groupId, userId: targetUserId } },
			select: { id: true },
		})
		if (!target) return { error: "NOT_FOUND" as const }

		await db.groupMember.delete({ where: { id: target.id } })
		return { error: null }
	},

	listJoinRequests: async (groupId: string): Promise<JoinRequestResponse[]> => {
		return db.groupJoinRequest.findMany({
			where: { groupId, status: "PENDING" },
			orderBy: { createdAt: "asc" },
			select: joinRequestSelect,
		})
	},

	listAllPendingRequests: async (): Promise<AdminPendingJoinRequestResponse[]> => {
		return db.groupJoinRequest.findMany({
			where: { status: "PENDING" },
			orderBy: { createdAt: "asc" },
			select: adminPendingJoinRequestSelect,
		})
	},

	updateJoinRequest: async (
		groupId: string,
		requestId: string,
		action: "APPROVED" | "REJECTED"
	) => {
		const request = await db.groupJoinRequest.findUnique({
			where: { id: requestId },
			select: {
				id: true,
				groupId: true,
				userId: true,
				status: true,
			},
		})

		if (!request || request.groupId !== groupId) return { error: "NOT_FOUND" as const }
		if (request.status !== "PENDING") return { error: "ALREADY_PROCESSED" as const }

		if (action === "APPROVED") {
			const group = await db.group.findUnique({
				where: { id: groupId },
				select: { maxMembers: true, _count: { select: { members: true } } },
			})
			if (!group) return { error: "NOT_FOUND" as const }
			if (group._count.members >= group.maxMembers) return { error: "FULL" as const }

			await db.$transaction(async (tx) => {
				await tx.groupJoinRequest.update({
					where: { id: requestId },
					data: { status: "APPROVED" },
				})
				await tx.groupMember.create({
					data: { groupId, userId: request.userId, role: "MEMBER" },
				})
				const hasJoinedBefore = await pointsDao.hasEverJoinedGroup(
					tx,
					request.userId,
					groupId
				)
				if (!hasJoinedBefore) {
					await pointsDao.applyPointsDelta(
						request.userId,
						JOIN_GROUP_BONUS,
						PointReason.JOIN_GROUP,
						{ tx, groupId }
					)
				}
			})
		} else {
			await db.groupJoinRequest.update({
				where: { id: requestId },
				data: { status: "REJECTED" },
			})
		}

		return { error: null, requesterId: request.userId, action }
	},

	generateInvite: async (groupId: string, expiresIn: "7d" | "30d" | "90d" | "never") => {
		const inviteCode = crypto.randomUUID().replace(/-/g, "")
		const expiryDays = { "7d": 7, "30d": 30, "90d": 90 } as const
		const inviteExpiresAt =
			expiresIn === "never"
				? null
				: new Date(Date.now() + expiryDays[expiresIn] * 24 * 60 * 60 * 1000)

		await db.group.update({
			where: { id: groupId },
			data: { inviteCode, inviteExpiresAt },
		})

		return { inviteCode, inviteExpiresAt }
	},

	revokeInvite: async (groupId: string) => {
		await db.group.update({
			where: { id: groupId },
			data: { inviteCode: null, inviteExpiresAt: null },
		})
	},
}
