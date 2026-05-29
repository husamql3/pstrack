import { logger, schedules } from "@trigger.dev/sdk/v3"

import { problemsDao } from "@/server/problems/problems.dao"

export const assignDailyProblemTask = schedules.task({
	id: "assign-daily-problem",
	cron: "0 0 * * *", // midnight UTC
	maxDuration: 120,
	run: async (payload) => {
		const date = new Date(
			Date.UTC(
				payload.timestamp.getUTCFullYear(),
				payload.timestamp.getUTCMonth(),
				payload.timestamp.getUTCDate()
			)
		)

		logger.log("Assigning daily problems", { date: date.toISOString() })

		const result = await problemsDao.assignDailyProblems(date)

		logger.log("Done", result)

		return result
	},
})
