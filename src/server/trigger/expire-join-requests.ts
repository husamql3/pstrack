import { logger, schedules } from "@trigger.dev/sdk/v3"

import { groupsDao } from "@/server/groups/groups.dao"
import { groupNotifications } from "@/server/groups/groups.notifications"
import { notifyAdmin } from "@/server/lib/bot"

export const expireJoinRequestsTask = schedules.task({
	id: "expire-join-requests",
	cron: "0 * * * *", // hourly
	maxDuration: 120,
	catchError: async ({ task, error, retryAt }) => {
		if (!retryAt) {
			notifyAdmin("job.failed", {
				jobName: task,
				error: error instanceof Error ? error.message : String(error),
				failedAt: new Date().toISOString(),
			})
		}
	},
	run: async () => {
		const { expired, requests } = await groupsDao.expirePendingRequests()

		logger.log("Expiring stale join requests", { expired })

		await Promise.all(
			requests.map((r) => groupNotifications.joinExpired(r.groupId, r.userId))
		)

		return { expired }
	},
})
