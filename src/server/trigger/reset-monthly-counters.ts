import { schedules } from "@trigger.dev/sdk/v3"

import { dispatchJob, monthlyKey } from "./dispatch-job"

export const resetMonthlyCountersTask = schedules.task({
	id: "reset-monthly-counters",
	cron: "0 0 1 * *",
	maxDuration: 120,
	run: async ({ timestamp }) =>
		dispatchJob(
			"reset-monthly-counters",
			timestamp,
			monthlyKey("reset-monthly-counters", timestamp)
		),
})
