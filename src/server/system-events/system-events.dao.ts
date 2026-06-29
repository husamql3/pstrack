import type { Prisma } from "@/generated/prisma/client"
import type { SystemEventTargetType, SystemEventType } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"

export type SystemEventWriteInput = {
	actorId?: string | null
	actorUsername?: string | null
	actorName?: string | null
	eventType: SystemEventType
	targetType?: SystemEventTargetType | null
	targetId?: string | null
	metadata?: Prisma.JsonObject
}

export const systemEventsDao = {
	log: async (input: SystemEventWriteInput): Promise<void> => {
		await db.systemEventLog.create({
			data: {
				actorId: input.actorId ?? null,
				actorUsername: input.actorUsername ?? null,
				actorName: input.actorName ?? null,
				eventType: input.eventType,
				targetType: input.targetType ?? null,
				targetId: input.targetId ?? null,
				metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
			},
		})
	},

	purgeOlderThan: async (before: Date): Promise<number> => {
		const result = await db.systemEventLog.deleteMany({
			where: { createdAt: { lt: before } },
		})
		return result.count
	},
}
