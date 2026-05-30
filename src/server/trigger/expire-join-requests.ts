import { logger, schedules } from "@trigger.dev/sdk/v3"

import { groupsDao } from "@/server/groups/groups.dao"
import { groupNotifications } from "@/server/groups/groups.notifications"

export const expireJoinRequestsTask = schedules.task({
	id: "expire-join-requests",
	cron: "0 * * * *", // hourly
	maxDuration: 120,
	run: async () => {
		const { expired, requests } = await groupsDao.expirePendingRequests()

		logger.log("Expiring stale join requests", { expired })

		await Promise.all(
			requests.map((r) => groupNotifications.joinExpired(r.groupId, r.userId))
		)

		return { expired }
	},
})
