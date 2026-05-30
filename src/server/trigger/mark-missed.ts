import { logger, schedules } from "@trigger.dev/sdk/v3"

import { problemsDao } from "@/server/problems/problems.dao"

const DAY_MS = 86_400_000

export const markMissedTask = schedules.task({
	id: "mark-missed",
	cron: "0 0 * * *", // midnight UTC — sweeps the day that just ended
	maxDuration: 300,
	run: async (payload) => {
		const yesterday = new Date(
			Date.UTC(
				payload.timestamp.getUTCFullYear(),
				payload.timestamp.getUTCMonth(),
				payload.timestamp.getUTCDate()
			) - DAY_MS
		)

		logger.log("Marking missed solves", { yesterday: yesterday.toISOString() })

		const result = await problemsDao.markMissedForDate(yesterday)

		logger.log("Done", result)

		return result
	},
})
