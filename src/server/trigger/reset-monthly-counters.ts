import { logger, schedules } from "@trigger.dev/sdk/v3"

import { problemsDao } from "@/server/problems/problems.dao"

export const resetMonthlyCountersTask = schedules.task({
	id: "reset-monthly-counters",
	cron: "0 0 1 * *", // first of the month, midnight UTC
	maxDuration: 60,
	run: async () => {
		logger.log("Resetting monthly counters")

		const result = await problemsDao.resetMonthlyCounters()

		logger.log("Done", result)

		return result
	},
})
