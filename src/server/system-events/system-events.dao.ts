import type { Prisma } from "@/generated/prisma/client"
import { SystemEventTargetType, type SystemEventType } from "@/generated/prisma/enums"
import { notifyAdmin } from "@/server/lib/bot"
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

// AgDR-0001 — realtime-classed events forwarded to husam-bot as `system.event`.
// Everything else (SOLVE_VERIFIED, SOLVE_FAILED, MISS_BATCH, PAUSE_USED,
// *_CHANGED, and JOIN_REQUEST_SENT which has its own dedicated buttoned emit) is
// intentionally NOT forwarded here — those are ignored or rolled into a digest.
// GROUP_CREATED joined this set as a low-volume growth signal for the beta.
const REALTIME_EVENTS = new Set<SystemEventType>([
	"GROUP_CREATED",
	"GROUP_LEFT",
	"MEMBER_REMOVED",
	"GROUP_JOINED",
	"JOIN_REQUEST_REJECTED",
])

// Best-effort human label for the event's target (group slug for GROUP targets).
const resolveTargetLabel = async (
	input: SystemEventWriteInput
): Promise<string | undefined> => {
	if (input.targetType === SystemEventTargetType.GROUP && input.targetId) {
		try {
			const g = await db.group.findUnique({
				where: { id: input.targetId },
				select: { slug: true },
			})
			return g ? `@${g.slug}` : undefined
		} catch {
			return undefined
		}
	}
	return undefined
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

		// Forward realtime-classed events to the admin bot after the row is
		// committed. Best-effort: notifyAdmin swallows+logs its own failures.
		if (REALTIME_EVENTS.has(input.eventType)) {
			const targetLabel = await resolveTargetLabel(input)
			await notifyAdmin("system.event", {
				type: input.eventType,
				actorName: input.actorName ?? undefined,
				actorUsername: input.actorUsername ?? undefined,
				targetType: input.targetType ?? undefined,
				targetLabel,
				at: new Date().toISOString(),
			})
		}
	},

	purgeOlderThan: async (before: Date): Promise<number> => {
		const result = await db.systemEventLog.deleteMany({
			where: { createdAt: { lt: before } },
		})
		return result.count
	},
}
