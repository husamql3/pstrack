import { schedules } from "@trigger.dev/sdk/v3"

import { dailyKey, dispatchJob } from "./dispatch-job"

export const expireAdminProGrantsTask = schedules.task({
	id: "expire-admin-pro-grants",
	cron: "10 0 * * *",
	maxDuration: 180,
	run: async ({ timestamp }) =>
		dispatchJob(
			"expire-admin-pro-grants",
			timestamp,
			dailyKey("expire-admin-pro-grants", timestamp)
		),
})
