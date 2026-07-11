import { schedules } from "@trigger.dev/sdk/v3"

import { dispatchJob, hourlyKey } from "./dispatch-job"

export const expireJoinRequestsTask = schedules.task({
	id: "expire-join-requests",
	cron: "0 * * * *",
	maxDuration: 180,
	run: async ({ timestamp }) =>
		dispatchJob(
			"expire-join-requests",
			timestamp,
			hourlyKey("expire-join-requests", timestamp)
		),
})
