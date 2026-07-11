import { describe, expect, it, vi } from "vitest"

import { testDb } from "@/test/db"
import { executeJobRun, getJobFreshness } from "./job-runs.service"

describe("JobRun ledger", () => {
	it("allows only one concurrent execution for an idempotency key", async () => {
		const execute = vi.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 25))
			return { processed: 1 }
		})

		const results = await Promise.all(
			Array.from({ length: 8 }, () =>
				executeJobRun("mark-missed", "mark-missed:2026-07-11", execute)
			)
		)

		expect(execute).toHaveBeenCalledTimes(1)
		expect(results.filter((result) => result.state === "completed")).toHaveLength(1)
		expect(
			results.filter((result) => result.state === "running" || result.state === "reused")
		).toHaveLength(7)
		await expect(testDb.jobRun.count()).resolves.toBe(1)
	})

	it("reuses a successful result without executing the job again", async () => {
		const execute = vi.fn(async () => ({ assigned: 3 }))

		await executeJobRun("assign-daily-problem", "assign:2026-07-11", execute)
		const replay = await executeJobRun(
			"assign-daily-problem",
			"assign:2026-07-11",
			execute
		)

		expect(replay).toEqual({ state: "reused", result: { assigned: 3 } })
		expect(execute).toHaveBeenCalledTimes(1)
	})

	it("records failures and permits an explicit retry with the same key", async () => {
		await expect(
			executeJobRun("mark-missed", "reconcile:2026-07-10", async () => {
				throw new Error("temporary failure")
			})
		).rejects.toThrow("temporary failure")

		await expect(
			executeJobRun("mark-missed", "reconcile:2026-07-10", async () => ({ missed: 2 }))
		).resolves.toEqual({ state: "completed", result: { missed: 2 } })

		const run = await testDb.jobRun.findUniqueOrThrow({
			where: {
				jobName_idempotencyKey: {
					jobName: "mark-missed",
					idempotencyKey: "reconcile:2026-07-10",
				},
			},
		})
		expect(run.attempts).toBe(2)
		expect(run.status).toBe("SUCCEEDED")
		expect(run.error).toBeNull()
	})

	it("exposes the latest successful run as freshness evidence", async () => {
		await executeJobRun("expire-join-requests", "expire:2026-07-11T12", async () => ({
			expired: 4,
		}))

		await expect(getJobFreshness()).resolves.toEqual([
			expect.objectContaining({
				jobName: "expire-join-requests",
				idempotencyKey: "expire:2026-07-11T12",
			}),
		])
	})
})
