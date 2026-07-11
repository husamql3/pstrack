import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
	executeJob: vi.fn(),
	executeJobRun: vi.fn(),
	getJobFreshness: vi.fn(),
}))

vi.mock("@/env", () => ({
	env: { JOB_DISPATCH_SECRET: "a-secure-job-dispatch-secret-value" },
}))
vi.mock("./jobs.service", () => ({ executeJob: mocks.executeJob }))
vi.mock("./job-runs.service", () => ({
	executeJobRun: mocks.executeJobRun,
	getJobFreshness: mocks.getJobFreshness,
}))

import { jobsController } from "./jobs.controller"

const request = (path: string, init?: RequestInit) =>
	jobsController.handle(new Request(`https://pstrack.test${path}`, init))

describe("internal jobs controller", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.executeJob.mockResolvedValue({ missed: 2 })
		mocks.executeJobRun.mockImplementation(async (_name, _key, execute) => ({
			state: "completed",
			result: await execute(),
		}))
	})

	it("rejects requests without the machine credential", async () => {
		const response = await request("/internal/jobs/mark-missed", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				idempotencyKey: "mark-missed:2026-07-11",
				scheduledAt: "2026-07-11T00:00:00.000Z",
			}),
		})

		expect(response.status).toBe(401)
		expect(mocks.executeJobRun).not.toHaveBeenCalled()
	})

	it("executes an authenticated job through the ledger", async () => {
		const response = await request("/internal/jobs/mark-missed", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				authorization: "Bearer a-secure-job-dispatch-secret-value",
			},
			body: JSON.stringify({
				idempotencyKey: "mark-missed:2026-07-11",
				scheduledAt: "2026-07-11T00:00:00.000Z",
			}),
		})

		expect(response.status).toBe(200)
		await expect(response.json()).resolves.toEqual({
			success: true,
			reused: false,
			result: { missed: 2 },
		})
		expect(mocks.executeJobRun).toHaveBeenCalledWith(
			"mark-missed",
			"mark-missed:2026-07-11",
			expect.any(Function)
		)
		expect(mocks.executeJob).toHaveBeenCalledWith(
			"mark-missed",
			new Date("2026-07-11T00:00:00.000Z")
		)
	})

	it("reports a concurrent duplicate as a conflict", async () => {
		mocks.executeJobRun.mockResolvedValue({ state: "running" })
		const response = await request("/internal/jobs/mark-missed", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				authorization: "Bearer a-secure-job-dispatch-secret-value",
			},
			body: JSON.stringify({
				idempotencyKey: "mark-missed:2026-07-11",
				scheduledAt: "2026-07-11T00:00:00.000Z",
			}),
		})

		expect(response.status).toBe(409)
	})
})
