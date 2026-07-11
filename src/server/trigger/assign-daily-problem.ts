import { schedules } from "@trigger.dev/sdk/v3"

import { dailyKey, dispatchJob } from "./dispatch-job"

export const assignDailyProblemTask = schedules.task({
	id: "assign-daily-problem",
	cron: "0 0 * * *",
	maxDuration: 360,
	run: async ({ timestamp }) =>
		dispatchJob(
			"assign-daily-problem",
			timestamp,
			dailyKey("assign-daily-problem", timestamp)
		),
})
