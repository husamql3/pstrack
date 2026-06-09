import type { Prisma } from "@/generated/prisma/client"
import { BadgeType, PointReason, SolveStatus } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import type { BadgeProgress } from "./badges.type"

type Tx = Prisma.TransactionClient

export const badgesDao = {
	evaluateAndAward: async (
		tx: Tx,
		userId: string,
		currentStreak: number
	): Promise<BadgeType[]> => {
		const now = new Date()
		const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

		const [
			existingBadges,
			solves,
			firstSolverCount,
			monthSolveCount,
			nc250Total,
			nc150Total,
			blind75Total,
		] = await Promise.all([
			tx.userBadge.findMany({ where: { userId }, select: { type: true } }),
			tx.userSolve.findMany({
				where: { userId, status: SolveStatus.SOLVED },
				select: {
					dailyProblem: {
						select: {
							problemId: true,
							problem: {
								select: {
									neetcode250: true,
									neetcode150: true,
									blind75: true,
								},
							},
						},
					},
				},
			}),
			tx.pointsHistory.count({ where: { userId, reason: PointReason.FIRST_IN_GROUP } }),
			tx.userSolve.count({
				where: { userId, status: SolveStatus.SOLVED, verifiedAt: { gte: startOfMonth } },
			}),
			tx.problem.count({ where: { neetcode250: true } }),
			tx.problem.count({ where: { neetcode150: true } }),
			tx.problem.count({ where: { blind75: true } }),
		])

		// Compute unique solved problem sets
		const seenProblemIds = new Set<string>()
		const nc250Solved = new Set<string>()
		const nc150Solved = new Set<string>()
		const blind75Solved = new Set<string>()

		for (const solve of solves) {
			const { problemId, problem } = solve.dailyProblem
			seenProblemIds.add(problemId)
			if (problem.neetcode250) nc250Solved.add(problemId)
			if (problem.neetcode150) nc150Solved.add(problemId)
			if (problem.blind75) blind75Solved.add(problemId)
		}

		const uniqueSolveCount = seenProblemIds.size

		const earned = new Set(existingBadges.map((b) => b.type))
		const toAward: BadgeType[] = []

		// Streak badges
		for (const [badge, threshold] of [
			[BadgeType.STREAK_7, 7],
			[BadgeType.STREAK_30, 30],
			[BadgeType.STREAK_100, 100],
			[BadgeType.STREAK_365, 365],
		] as [BadgeType, number][]) {
			if (currentStreak >= threshold && !earned.has(badge)) {
				toAward.push(badge)
			}
		}

		// Volume badges
		for (const [badge, threshold] of [
			[BadgeType.SOLVED_1, 1],
			[BadgeType.SOLVED_10, 10],
			[BadgeType.SOLVED_50, 50],
			[BadgeType.SOLVED_100, 100],
		] as [BadgeType, number][]) {
			if (uniqueSolveCount >= threshold && !earned.has(badge)) {
				toAward.push(badge)
			}
		}

		// Roadmap complete badges
		if (
			nc250Total > 0 &&
			nc250Solved.size >= nc250Total &&
			!earned.has(BadgeType.NC250_COMPLETE)
		) {
			toAward.push(BadgeType.NC250_COMPLETE)
		}
		if (
			nc150Total > 0 &&
			nc150Solved.size >= nc150Total &&
			!earned.has(BadgeType.NC150_COMPLETE)
		) {
			toAward.push(BadgeType.NC150_COMPLETE)
		}
		if (
			blind75Total > 0 &&
			blind75Solved.size >= blind75Total &&
			!earned.has(BadgeType.BLIND75_COMPLETE)
		) {
			toAward.push(BadgeType.BLIND75_COMPLETE)
		}

		// Social badges
		for (const [badge, threshold] of [
			[BadgeType.FIRST_SOLVER_1, 1],
			[BadgeType.FIRST_SOLVER_10, 10],
			[BadgeType.FIRST_SOLVER_50, 50],
		] as [BadgeType, number][]) {
			if (firstSolverCount >= threshold && !earned.has(badge)) {
				toAward.push(badge)
			}
		}

		if (monthSolveCount >= 30 && !earned.has(BadgeType.CONSISTENT_30)) {
			toAward.push(BadgeType.CONSISTENT_30)
		}

		if (toAward.length > 0) {
			await tx.userBadge.createMany({
				data: toAward.map((type) => ({ userId, type })),
				skipDuplicates: true,
			})
		}

		return toAward
	},

	computeProgress: async (userId: string): Promise<BadgeProgress> => {
		const now = new Date()
		const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

		const [user, solves, firstSolverCount, monthSolveCount] = await Promise.all([
			db.user.findUnique({ where: { id: userId }, select: { currentStreak: true } }),
			db.userSolve.findMany({
				where: { userId, status: SolveStatus.SOLVED },
				select: {
					dailyProblem: {
						select: {
							problemId: true,
							problem: {
								select: {
									neetcode250: true,
									neetcode150: true,
									blind75: true,
								},
							},
						},
					},
				},
			}),
			db.pointsHistory.count({ where: { userId, reason: PointReason.FIRST_IN_GROUP } }),
			db.userSolve.count({
				where: { userId, status: SolveStatus.SOLVED, verifiedAt: { gte: startOfMonth } },
			}),
		])

		const seenProblemIds = new Set<string>()
		const nc250Solved = new Set<string>()
		const nc150Solved = new Set<string>()
		const blind75Solved = new Set<string>()

		for (const solve of solves) {
			const { problemId, problem } = solve.dailyProblem
			seenProblemIds.add(problemId)
			if (problem.neetcode250) nc250Solved.add(problemId)
			if (problem.neetcode150) nc150Solved.add(problemId)
			if (problem.blind75) blind75Solved.add(problemId)
		}

		return {
			currentStreak: user?.currentStreak ?? 0,
			uniqueSolveCount: seenProblemIds.size,
			nc250SolvedCount: nc250Solved.size,
			nc150SolvedCount: nc150Solved.size,
			blind75SolvedCount: blind75Solved.size,
			firstSolverCount,
			monthSolveCount,
		}
	},
}
