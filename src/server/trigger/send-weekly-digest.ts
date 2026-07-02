import { logger, schedules } from "@trigger.dev/sdk/v3"

import { SolveStatus } from "@/generated/prisma/enums"
import { notifyAdmin } from "@/server/lib/bot"
import { db } from "@/server/lib/db"

const WEEK_MS = 7 * 86_400_000

export const sendWeeklyDigestTask = schedules.task({
	id: "send-weekly-digest",
	cron: "0 9 * * 1", // Mondays 09:00 UTC
	maxDuration: 120,
	catchError: async ({ task, error, retryAt }) => {
		if (!retryAt) {
			await notifyAdmin("job.failed", {
				jobName: task,
				error: error instanceof Error ? error.message : String(error),
				failedAt: new Date().toISOString(),
			})
		}
	},
	run: async () => {
		const now = new Date()
		const weekStart = new Date(now.getTime() - WEEK_MS)
		const prevStart = new Date(now.getTime() - 2 * WEEK_MS)

		const [users, proUsers, newUsers, solves, solvesPrev] = await Promise.all([
			db.user.count(),
			db.user.count({ where: { isPro: true } }),
			db.user.count({ where: { createdAt: { gte: weekStart } } }),
			db.userSolve.count({
				where: { status: SolveStatus.SOLVED, createdAt: { gte: weekStart } },
			}),
			db.userSolve.count({
				where: {
					status: SolveStatus.SOLVED,
					createdAt: { gte: prevStart, lt: weekStart },
				},
			}),
		])

		await notifyAdmin("digest.weekly", {
			weekStart: weekStart.toISOString().slice(0, 10),
			weekEnd: now.toISOString().slice(0, 10),
			users,
			usersDelta: newUsers, // weekly growth
			solves,
			solvesDelta: solves - solvesPrev,
			proUsers,
			newUsers,
		})

		logger.log("Weekly digest sent", { users, solves, newUsers })
		return { users, solves, newUsers }
	},
})
