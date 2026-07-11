import { schedules } from "@trigger.dev/sdk/v3"

import { dailyKey, dispatchJob } from "./dispatch-job"

export const sendWeeklyDigestTask = schedules.task({
	id: "send-weekly-digest",
	cron: "0 9 * * 1",
	maxDuration: 180,
	run: async ({ timestamp }) =>
		dispatchJob(
			"send-weekly-digest",
			timestamp,
			dailyKey("send-weekly-digest", timestamp)
		),
})
