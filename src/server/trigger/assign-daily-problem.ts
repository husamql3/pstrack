import { logger, schedules } from "@trigger.dev/sdk/v3"

import { problemsDao } from "@/server/problems/problems.dao"
import { sendDailyDigestBatchTask } from "./send-daily-digest-batch"

const DIGEST_BATCH_SIZE = 100

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
		const dateKey = date.toISOString().slice(0, 10)

		logger.log("Assigning daily problems", { date: date.toISOString() })
		const result = await problemsDao.assignDailyProblems(date)

		const recipients = await problemsDao.getDailyDigestRecipients(date)

		const batches: (typeof recipients)[] = []
		for (let i = 0; i < recipients.length; i += DIGEST_BATCH_SIZE) {
			batches.push(recipients.slice(i, i + DIGEST_BATCH_SIZE))
		}

		if (batches.length > 0) {
			logger.log("Scheduling daily digest batches", {
				batches: batches.length,
				recipients: recipients.length,
			})
			await sendDailyDigestBatchTask.batchTrigger(
				batches.map((batch, batchIndex) => ({
					payload: { recipients: batch, dateKey, batchIndex },
					options: {
						idempotencyKey: `daily-digest:${dateKey}:${batchIndex}`,
					},
				}))
			)
		}

		logger.log("Done", {
			...result,
			recipients: recipients.length,
			batches: batches.length,
		})

		return {
			...result,
			recipients: recipients.length,
			batches: batches.length,
		}
	},
})
