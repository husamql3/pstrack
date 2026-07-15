import { timingSafeEqual } from "node:crypto"
import { Elysia, status, t } from "elysia"

import { env } from "@/env"
import { executeJobRun, FRESHNESS_MS, getJobFreshness } from "./job-runs.service"
import { executeJob } from "./jobs.service"
import { isJobName, JOB_NAMES } from "./jobs.types"

const isAuthorized = (request: Request) => {
	const expected = env.JOB_DISPATCH_SECRET
	const authorization = request.headers.get("authorization")
	if (!expected || !authorization?.startsWith("Bearer ")) return false

	const actualBuffer = Buffer.from(authorization.slice("Bearer ".length))
	const expectedBuffer = Buffer.from(expected)
	return (
		actualBuffer.length === expectedBuffer.length &&
		timingSafeEqual(actualBuffer, expectedBuffer)
	)
}

export const jobsController = new Elysia({ prefix: "/internal/jobs" })
	.post(
		"/:jobName",
		async ({ request, params, body }) => {
			if (!isAuthorized(request)) return status(401, { error: "Unauthorized" })
			if (!isJobName(params.jobName)) return status(404, { error: "Unknown job" })

			const jobName = params.jobName
			const scheduledAt = new Date(body.scheduledAt)
			const execution = await executeJobRun(jobName, body.idempotencyKey, () =>
				executeJob(jobName, scheduledAt)
			)
			if (execution.state === "running") {
				return status(409, { error: "Job run is already in progress" })
			}
			return {
				success: true,
				reused: execution.state === "reused",
				result: execution.result,
			}
		},
		{
			params: t.Object({ jobName: t.String({ minLength: 1 }) }),
			body: t.Object({
				idempotencyKey: t.String({ minLength: 1, maxLength: 200 }),
				scheduledAt: t.String({ format: "date-time" }),
			}),
			detail: { hide: true },
		}
	)
	.get(
		"/freshness",
		async ({ request }) => {
			if (!isAuthorized(request)) return status(401, { error: "Unauthorized" })

			const latest = await getJobFreshness()
			const byName = new Map(latest.map((run) => [run.jobName, run]))
			const now = Date.now()
			return {
				jobs: JOB_NAMES.filter(
					(jobName) =>
						jobName !== "reset-today-problems" && jobName !== "reconcile-mark-missed"
				).map((jobName) => {
					const run = byName.get(jobName)
					const finishedAt = run?.finishedAt ?? null
					return {
						jobName,
						fresh: Boolean(
							finishedAt && now - finishedAt.getTime() <= FRESHNESS_MS[jobName]
						),
						finishedAt: finishedAt?.toISOString() ?? null,
						idempotencyKey: run?.idempotencyKey ?? null,
					}
				}),
			}
		},
		{ detail: { hide: true } }
	)
