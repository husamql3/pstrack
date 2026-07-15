import { Prisma } from "@/generated/prisma/client"
import { JobRunStatus } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { JOB_NAMES, type JobName } from "./jobs.types"

const STALE_RUN_MS = 15 * 60 * 1000

// How long after a successful run a job is still considered "fresh". Beyond this
// it's reported as stale by /freshness and flagged in the hourly ops digest.
// Single source of truth shared by the freshness endpoint and getStaleJobNames.
export const FRESHNESS_MS: Record<JobName, number> = {
	"assign-daily-problem": 26 * 60 * 60 * 1000,
	"mark-missed": 26 * 60 * 60 * 1000,
	"expire-join-requests": 2 * 60 * 60 * 1000,
	"reset-monthly-counters": 32 * 24 * 60 * 60 * 1000,
	"expire-admin-pro-grants": 26 * 60 * 60 * 1000,
	"purge-system-events": 32 * 24 * 60 * 60 * 1000,
	"send-weekly-digest": 8 * 24 * 60 * 60 * 1000,
	"send-hourly-digest": 90 * 60 * 1000,
	"reconcile-points": 26 * 60 * 60 * 1000,
	"reset-today-problems": Number.POSITIVE_INFINITY,
	"reconcile-mark-missed": Number.POSITIVE_INFINITY,
}

type JobResult = Record<string, unknown>

export type JobExecution =
	| { state: "completed"; result: JobResult }
	| { state: "reused"; result: JobResult }
	| { state: "running" }

const asJobResult = (value: Prisma.JsonValue | null): JobResult => {
	if (!value || Array.isArray(value) || typeof value !== "object") return {}
	return value as JobResult
}

const claimRun = async (jobName: JobName, idempotencyKey: string) => {
	try {
		const run = await db.jobRun.create({
			data: { jobName, idempotencyKey },
		})
		return { run, claimed: true }
	} catch (error) {
		if (
			!(error instanceof Prisma.PrismaClientKnownRequestError) ||
			error.code !== "P2002"
		) {
			throw error
		}
	}

	const existing = await db.jobRun.findUniqueOrThrow({
		where: { jobName_idempotencyKey: { jobName, idempotencyKey } },
	})
	if (existing.status === JobRunStatus.SUCCEEDED) {
		return { run: existing, claimed: false }
	}

	const staleBefore = new Date(Date.now() - STALE_RUN_MS)
	const claimed = await db.jobRun.updateMany({
		where: {
			id: existing.id,
			OR: [
				{ status: JobRunStatus.FAILED },
				{ status: JobRunStatus.RUNNING, startedAt: { lt: staleBefore } },
			],
		},
		data: {
			status: JobRunStatus.RUNNING,
			attempts: { increment: 1 },
			startedAt: new Date(),
			finishedAt: null,
			error: null,
		},
	})

	if (claimed.count === 0) return { run: existing, claimed: false }
	return {
		run: await db.jobRun.findUniqueOrThrow({ where: { id: existing.id } }),
		claimed: true,
	}
}

export const executeJobRun = async (
	jobName: JobName,
	idempotencyKey: string,
	execute: () => Promise<JobResult>
): Promise<JobExecution> => {
	const { run, claimed } = await claimRun(jobName, idempotencyKey)
	if (run.status === JobRunStatus.SUCCEEDED) {
		return { state: "reused", result: asJobResult(run.result) }
	}
	if (!claimed) return { state: "running" }

	try {
		const result = await execute()
		await db.jobRun.update({
			where: { id: run.id },
			data: {
				status: JobRunStatus.SUCCEEDED,
				result: result as Prisma.InputJsonValue,
				finishedAt: new Date(),
			},
		})
		return { state: "completed", result }
	} catch (error) {
		await db.jobRun.update({
			where: { id: run.id },
			data: {
				status: JobRunStatus.FAILED,
				error: error instanceof Error ? error.message.slice(0, 2000) : String(error),
				finishedAt: new Date(),
			},
		})
		throw error
	}
}

export const getJobFreshness = async () => {
	const rows = await db.jobRun.findMany({
		where: { status: JobRunStatus.SUCCEEDED },
		distinct: ["jobName"],
		orderBy: [{ jobName: "asc" }, { finishedAt: "desc" }],
		select: { jobName: true, finishedAt: true, idempotencyKey: true },
	})
	return rows
}

// Scheduled jobs whose last success is older than their freshness window.
// Jobs that have never run are NOT flagged (avoids false alarms on a fresh
// deploy before each cron's first tick); manual/on-demand jobs (Infinity
// threshold) are excluded entirely.
export const getStaleJobNames = async (now: Date): Promise<JobName[]> => {
	const latest = await getJobFreshness()
	const finishedByName = new Map(latest.map((run) => [run.jobName, run.finishedAt]))
	const nowMs = now.getTime()
	return JOB_NAMES.filter((jobName) => {
		const threshold = FRESHNESS_MS[jobName]
		if (!Number.isFinite(threshold)) return false
		const finishedAt = finishedByName.get(jobName)
		if (!finishedAt) return false
		return nowMs - finishedAt.getTime() > threshold
	})
}
