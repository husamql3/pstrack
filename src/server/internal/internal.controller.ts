import { Elysia, status } from "elysia"

import { env } from "@/env"
import { JoinRequestStatus, SolveStatus } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"

const getTodaySolveStats = async () => {
	const now = new Date()
	const today = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
	)

	const [totalSolves, solvers] = await Promise.all([
		db.userSolve.count({
			where: { status: SolveStatus.SOLVED, dailyProblem: { assignedDate: today } },
		}),
		db.userSolve.findMany({
			where: { status: SolveStatus.SOLVED, dailyProblem: { assignedDate: today } },
			select: { userId: true },
			distinct: ["userId"],
		}),
	])

	return { totalSolves, activeUsers: solvers.length }
}

export const internalController = new Elysia({ prefix: "/internal" }).get(
	"/bot",
	async ({ request }) => {
		const auth = request.headers.get("Authorization") ?? ""
		if (!env.BOT_NOTIFY_SECRET || auth !== `Bearer ${env.BOT_NOTIFY_SECRET}`) {
			return status(401, { error: "Unauthorized" })
		}

		const [totalUsers, pendingRequests, unreviewedFeedbacks, solveStats] =
			await Promise.all([
				db.user.count(),
				db.groupJoinRequest.count({ where: { status: JoinRequestStatus.PENDING } }),
				db.feedback.findMany({
					where: { reviewed: false },
					orderBy: { createdAt: "desc" },
					take: 5,
					select: {
						id: true,
						description: true,
						createdAt: true,
						user: { select: { email: true } },
					},
				}),
				getTodaySolveStats(),
			])

		return {
			users: { total: totalUsers },
			joinRequests: { pending: pendingRequests },
			feedbacks: {
				unreviewed: unreviewedFeedbacks.map((f) => ({
					id: f.id,
					userEmail: f.user.email,
					text: f.description ?? "",
					createdAt: f.createdAt.toISOString(),
				})),
			},
			solves: {
				today: solveStats.totalSolves,
				activeUsers: solveStats.activeUsers,
			},
		}
	},
	{ detail: { hide: true } }
)
