import type { Prisma } from "@/generated/prisma/client"
import {
	type AdminGroupListItem,
	adminGroupListSelect,
	type PaginatedResponse,
} from "@/server/admin/admin.type"
import { adminAuditDao } from "@/server/admin/admin-audit.dao"
import { db } from "@/server/lib/db"

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

export const groupsAdminDao = {
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
}
