import { schedules } from "@trigger.dev/sdk/v3"

import { dailyKey, dispatchJob } from "./dispatch-job"

export const reconcilePointsTask = schedules.task({
	id: "reconcile-points",
	cron: "30 0 * * *",
	maxDuration: 180,
	run: async ({ timestamp }) =>
		dispatchJob("reconcile-points", timestamp, dailyKey("reconcile-points", timestamp)),
})
