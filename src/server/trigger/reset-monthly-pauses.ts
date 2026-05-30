import { logger, schedules } from "@trigger.dev/sdk/v3"

import { problemsDao } from "@/server/problems/problems.dao"

export const resetMonthlyPausesTask = schedules.task({
	id: "reset-monthly-pauses",
	cron: "0 0 1 * *", // first of the month, midnight UTC
	maxDuration: 60,
	run: async () => {
		logger.log("Resetting monthly pause counts")

		const result = await problemsDao.resetMonthlyPauses()

		logger.log("Done", result)

		return result
	},
})
