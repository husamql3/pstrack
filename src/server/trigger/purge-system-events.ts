import { logger, schedules } from "@trigger.dev/sdk/v3"

import { systemEventsDao } from "@/server/system-events/system-events.dao"

const RETENTION_DAYS = 90

export const purgeSystemEventsTask = schedules.task({
	id: "purge-system-events",
	cron: "0 3 1 * *", // 3am UTC on the 1st of each month
	maxDuration: 60,
	run: async () => {
		const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

		logger.log("Purging system event logs", { before: cutoff.toISOString() })

		const deleted = await systemEventsDao.purgeOlderThan(cutoff)

		logger.log("Purge complete", { deleted })

		return { deleted }
	},
})
