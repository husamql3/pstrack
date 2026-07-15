import { schedules } from "@trigger.dev/sdk/v3"

import { dispatchJob, monthlyKey } from "./dispatch-job"

export const purgeSystemEventsTask = schedules.task({
	id: "purge-system-events",
	cron: "0 3 1 * *",
	maxDuration: 120,
	run: async ({ timestamp }) =>
		dispatchJob(
			"purge-system-events",
			timestamp,
			monthlyKey("purge-system-events", timestamp)
		),
})
