import { logger, task } from "@trigger.dev/sdk/v3"

import { db } from "@/server/lib/db"

export const resetTodayProblemsTask = task({
	id: "reset-today-problems",
	maxDuration: 60,
	run: async () => {
		const today = new Date()
		const date = new Date(
			Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
		)

		logger.log("Deleting today's daily problems", { date: date.toISOString() })

		const dailyProblems = await db.dailyProblem.findMany({
			where: { assignedDate: date },
			select: { id: true },
		})
		const ids = dailyProblems.map((dp) => dp.id)

		const [{ count: solvesDeleted }, { count: problemsDeleted }] = await db.$transaction([
			db.userSolve.deleteMany({ where: { dailyProblemId: { in: ids } } }),
			db.dailyProblem.deleteMany({ where: { id: { in: ids } } }),
		])

		logger.log("Done", { problemsDeleted, solvesDeleted })

		return { problemsDeleted, solvesDeleted }
	},
})
