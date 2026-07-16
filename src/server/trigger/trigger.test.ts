// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@trigger.dev/sdk/v3", () => ({
	schedules: { task: vi.fn((config) => config) },
	task: vi.fn((config) => config),
}))

import { assignDailyProblemTask } from "./assign-daily-problem"
import { expireAdminProGrantsTask } from "./expire-admin-pro-grants"
import { expireJoinRequestsTask } from "./expire-join-requests"
import { markMissedTask } from "./mark-missed"
import { purgeSystemEventsTask } from "./purge-system-events"
import { reconcilePointsTask } from "./reconcile-points"
import { resetMonthlyCountersTask } from "./reset-monthly-counters"
import { resetTodayProblemsTask } from "./reset-today-problems"
import { sendWeeklyDigestTask } from "./send-weekly-digest"

const timestamp = new Date("2026-07-11T12:34:00.000Z")

describe("Trigger job dispatchers", () => {
	beforeEach(() => {
		process.env.JOB_DISPATCH_URL = "https://pstrack.test/"
		process.env.JOB_DISPATCH_SECRET = "test-job-dispatch-secret"
		vi.useFakeTimers()
		vi.setSystemTime(timestamp)
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({ success: true, reused: false, result: { processed: 1 } })
			)
		)
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.unstubAllGlobals()
	})

	it.each([
		[assignDailyProblemTask, "assign-daily-problem", "assign-daily-problem:2026-07-11"],
		[markMissedTask, "mark-missed", "mark-missed:2026-07-11"],
		[
			expireJoinRequestsTask,
			"expire-join-requests",
			"expire-join-requests:2026-07-11T12",
		],
		[
			resetMonthlyCountersTask,
			"reset-monthly-counters",
			"reset-monthly-counters:2026-07",
		],
		[
			expireAdminProGrantsTask,
			"expire-admin-pro-grants",
			"expire-admin-pro-grants:2026-07-11",
		],
		[purgeSystemEventsTask, "purge-system-events", "purge-system-events:2026-07"],
		[reconcilePointsTask, "reconcile-points", "reconcile-points:2026-07-11"],
		[sendWeeklyDigestTask, "send-weekly-digest", "send-weekly-digest:2026-07-11"],
	])(
		"dispatches %s through the authenticated app endpoint",
		async (task, jobName, key) => {
			await task.run({ timestamp })

			expect(fetch).toHaveBeenCalledWith(
				`https://pstrack.test/api/v3/internal/jobs/${jobName}`,
				expect.objectContaining({
					method: "POST",
					headers: {
						"content-type": "application/json",
						authorization: "Bearer test-job-dispatch-secret",
					},
					body: JSON.stringify({
						idempotencyKey: key,
						scheduledAt: timestamp.toISOString(),
					}),
				})
			)
		}
	)

	it("dispatches the manual reset with a daily idempotency key", async () => {
		await resetTodayProblemsTask.run()
		expect(fetch).toHaveBeenCalledWith(
			"https://pstrack.test/api/v3/internal/jobs/reset-today-problems",
			expect.objectContaining({
				body: JSON.stringify({
					idempotencyKey: "reset-today-problems:2026-07-11",
					scheduledAt: timestamp.toISOString(),
				}),
			})
		)
	})
})
