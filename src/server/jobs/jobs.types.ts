export const JOB_NAMES = [
	"assign-daily-problem",
	"mark-missed",
	"expire-join-requests",
	"reset-monthly-counters",
	"expire-admin-pro-grants",
	"purge-system-events",
	"send-weekly-digest",
	"send-hourly-digest",
	"reconcile-points",
	"reset-today-problems",
	"reconcile-mark-missed",
] as const

export type JobName = (typeof JOB_NAMES)[number]

export const isJobName = (value: string): value is JobName =>
	JOB_NAMES.some((jobName) => jobName === value)
