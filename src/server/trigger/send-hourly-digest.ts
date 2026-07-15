import { schedules } from "@trigger.dev/sdk/v3"

import { dispatchJob, hourlyKey } from "./dispatch-job"

export const sendHourlyDigestTask = schedules.task({
	id: "send-hourly-digest",
	cron: "0 * * * *",
	maxDuration: 120,
	run: async ({ timestamp }) =>
		dispatchJob(
			"send-hourly-digest",
			timestamp,
			hourlyKey("send-hourly-digest", timestamp)
		),
})
