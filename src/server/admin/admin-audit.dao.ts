import type { Prisma, PrismaClient } from "@/generated/prisma/client"
import type {
	AdminAuditAction,
	AdminAuditTargetType,
	SystemEventTargetType,
	SystemEventType,
} from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import {
	type AdminAuditWriteInput,
	adminAuditLogSelect,
	systemEventLogSelect,
	type UnifiedAuditEntry,
	type UnifiedAuditResponse,
} from "./admin.type"

type Db = PrismaClient | Prisma.TransactionClient

type UnifiedListParams = {
	actor?: string | null
	action?: AdminAuditAction | null
	eventType?: SystemEventType | null
	targetType?: AdminAuditTargetType | SystemEventTargetType | null
	targetId?: string | null
	origin?: "admin" | "system" | null
	before?: string | null
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

	list: async (params: UnifiedListParams): Promise<UnifiedAuditResponse> => {
		const before = params.before ? new Date(params.before) : new Date()
		const take = params.limit + 1

		const [adminRows, systemRows] = await Promise.all([
			params.origin === "system"
				? []
				: db.adminAuditLog.findMany({
						where: {
							...(params.actor ? { adminId: params.actor } : {}),
							...(params.action ? { action: params.action } : {}),
							...(params.targetType
								? { targetType: params.targetType as AdminAuditTargetType }
								: {}),
							...(params.targetId ? { targetId: params.targetId } : {}),
							createdAt: { lt: before },
						},
						select: adminAuditLogSelect,
						orderBy: { createdAt: "desc" },
						take,
					}),
			params.origin === "admin"
				? []
				: db.systemEventLog.findMany({
						where: {
							...(params.actor ? { actorId: params.actor } : {}),
							...(params.eventType ? { eventType: params.eventType } : {}),
							...(params.targetType
								? { targetType: params.targetType as SystemEventTargetType }
								: {}),
							...(params.targetId ? { targetId: params.targetId } : {}),
							createdAt: { lt: before },
						},
						select: systemEventLogSelect,
						orderBy: { createdAt: "desc" },
						take,
					}),
		])

		const merged: UnifiedAuditEntry[] = [
			...adminRows.map((r) => ({ origin: "admin" as const, ...r })),
			...systemRows.map((r) => ({ origin: "system" as const, ...r })),
		].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

		const hasMore = merged.length > params.limit
		const items = hasMore ? merged.slice(0, params.limit) : merged
		const last = items[items.length - 1]

		return {
			items,
			nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
		}
	},
}
