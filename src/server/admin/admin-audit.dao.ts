import type { Prisma, PrismaClient } from "@/generated/prisma/client"
import type { AdminAuditAction, AdminAuditTargetType } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import {
	type AdminAuditLogResponse,
	type AdminAuditWriteInput,
	adminAuditLogSelect,
	type PaginatedResponse,
} from "./admin.type"

type Db = PrismaClient | Prisma.TransactionClient

type AuditListParams = {
	actor?: string | null
	action?: AdminAuditAction | null
	targetType?: AdminAuditTargetType | null
	targetId?: string | null
	cursor?: string | null
	limit: number
}

export const adminAuditDao = {
	log: async (input: AdminAuditWriteInput, client: Db = db) => {
		await client.adminAuditLog.create({
			data: {
				adminId: input.adminId,
				action: input.action,
				targetType: input.target?.type ?? null,
				targetId: input.target?.id ?? null,
				metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
			},
		})
	},

	list: async (
		params: AuditListParams
	): Promise<PaginatedResponse<AdminAuditLogResponse>> => {
		const where: Prisma.AdminAuditLogWhereInput = {}
		if (params.actor) where.adminId = params.actor
		if (params.action) where.action = params.action
		if (params.targetType) where.targetType = params.targetType
		if (params.targetId) where.targetId = params.targetId

		const rows = await db.adminAuditLog.findMany({
			where,
			select: adminAuditLogSelect,
			orderBy: { createdAt: "desc" },
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
}
