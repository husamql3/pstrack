import { task } from "@trigger.dev/sdk/v3"

import { dailyKey, dispatchJob } from "./dispatch-job"

export const resetTodayProblemsTask = task({
	id: "reset-today-problems",
	maxDuration: 120,
	run: async () => {
		const timestamp = new Date()
		return dispatchJob(
			"reset-today-problems",
			timestamp,
			dailyKey("reset-today-problems", timestamp)
		)
	},
})
