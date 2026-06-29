import { logger, schedules } from "@trigger.dev/sdk/v3"

import { SystemEventType } from "@/generated/prisma/enums"
import { problemsDao } from "@/server/problems/problems.dao"
import { systemEventsDao } from "@/server/system-events/system-events.dao"

const DAY_MS = 86_400_000
const CATCH_UP_DAYS = 14

export const markMissedTask = schedules.task({
	id: "mark-missed",
	cron: "0 0 * * *", // midnight UTC - sweeps the day that just ended
	maxDuration: 300,
	run: async (payload) => {
		const today = new Date(
			Date.UTC(
				payload.timestamp.getUTCFullYear(),
				payload.timestamp.getUTCMonth(),
				payload.timestamp.getUTCDate()
			)
		)
		const yesterday = new Date(today.getTime() - DAY_MS)

		logger.log("Marking missed solves", {
			yesterday: yesterday.toISOString(),
			catchUpDays: CATCH_UP_DAYS,
		})

		const result = { missed: 0, warned: 0, removed: 0 }
		for (let offset = CATCH_UP_DAYS; offset >= 1; offset--) {
			const day = new Date(today.getTime() - offset * DAY_MS)
			const shouldEvaluateWarnings = day.getTime() === yesterday.getTime()
			const dayResult = await problemsDao.markMissedForDate(day, {
				evaluateWarnings: shouldEvaluateWarnings,
			})
			result.missed += dayResult.missed
			result.warned += dayResult.warned
			result.removed += dayResult.removed
		}

		if (result.missed > 0) {
			await systemEventsDao
				.log({
					actorId: null,
					actorUsername: "system",
					actorName: "System",
					eventType: SystemEventType.MISS_BATCH,
					metadata: { count: result.missed, date: yesterday.toISOString() },
				})
				.catch(() => {})
		}

		logger.log("Done", result)

		return result
	},
})
