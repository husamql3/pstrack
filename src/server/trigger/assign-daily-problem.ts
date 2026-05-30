import { logger, schedules } from "@trigger.dev/sdk/v3"

import { problemsDao } from "@/server/problems/problems.dao"
import { problemNotifications } from "@/server/problems/problems.notifications"

export const assignDailyProblemTask = schedules.task({
	id: "assign-daily-problem",
	cron: "0 0 * * *", // midnight UTC
	maxDuration: 300,
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

		logger.log("Sending daily problem digest")
		const recipients = await problemsDao.getDailyDigestRecipients(date)
		await problemNotifications.dailyProblemDigest(recipients)

		logger.log("Done", { ...result, emailsSent: recipients.length })

		return { ...result, emailsSent: recipients.length }
	},
})
