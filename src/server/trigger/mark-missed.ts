import { schedules } from "@trigger.dev/sdk/v3"

import { dailyKey, dispatchJob } from "./dispatch-job"

export const markMissedTask = schedules.task({
	id: "mark-missed",
	cron: "0 0 * * *",
	maxDuration: 360,
	run: async ({ timestamp }) =>
		dispatchJob("mark-missed", timestamp, dailyKey("mark-missed", timestamp)),
})
