import type { JobName } from "@/server/jobs/jobs.types"

const REQUEST_TIMEOUT_MS = 310_000

export const dispatchJob = async (
	jobName: JobName,
	scheduledAt: Date,
	idempotencyKey: string
): Promise<Record<string, unknown>> => {
	const baseUrl = process.env.JOB_DISPATCH_URL?.replace(/\/$/, "")
	const secret = process.env.JOB_DISPATCH_SECRET
	if (!baseUrl || !secret) {
		throw new Error("JOB_DISPATCH_URL and JOB_DISPATCH_SECRET are required")
	}

	const response = await fetch(`${baseUrl}/api/v3/internal/jobs/${jobName}`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${secret}`,
		},
		body: JSON.stringify({
			idempotencyKey,
			scheduledAt: scheduledAt.toISOString(),
		}),
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	})
	const body = await response.json().catch(() => null)
	if (!response.ok) {
		throw new Error(`Job dispatch failed (${response.status}): ${JSON.stringify(body)}`)
	}
	return body as Record<string, unknown>
}

export const dailyKey = (jobName: JobName, date: Date) =>
	`${jobName}:${date.toISOString().slice(0, 10)}`

export const hourlyKey = (jobName: JobName, date: Date) =>
	`${jobName}:${date.toISOString().slice(0, 13)}`

export const monthlyKey = (jobName: JobName, date: Date) =>
	`${jobName}:${date.toISOString().slice(0, 7)}`
