import type { Prisma } from "@/generated/prisma/client"
import { SolveStatus } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { NEETCODE_250_PROBLEMS } from "./problems.seed"
import {
	type MarkSolvedResult,
	type PauseTodayResult,
	problemSelect,
	type RoadmapKey,
	type RoadmapProblemResponse,
	type TodayProblemResponse,
} from "./problems.type"

const LAUNCH_DATE_UTC = Date.UTC(2026, 0, 1)

const startOfTodayUtc = () => {
	const now = new Date()
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

const pauseLimitFor = (user: { isPro: boolean }) => (user.isPro ? 4 : 2)

const roadmapFilter = (roadmap: RoadmapKey): Prisma.ProblemWhereInput => {
	switch (roadmap) {
		case "NC150":
			return { neetcode150: true }
		case "BLIND75":
			return { blind75: true }
		default:
			return { neetcode250: true }
	}
}

const pickProblemForDate = async (assignedDate: Date, roadmap: RoadmapKey) => {
	const filter = roadmapFilter(roadmap)
	const count = await db.problem.count({ where: filter })
	if (count === 0) return null

	const daysSinceLaunch = Math.max(
		0,
		Math.floor((assignedDate.getTime() - LAUNCH_DATE_UTC) / 86_400_000)
	)
	const skip = daysSinceLaunch % count

	return db.problem.findFirst({
		where: filter,
		orderBy: { roadmapIndex: "asc" },
		skip,
		select: { id: true },
	})
}

const ensureDailyProblem = async (
	groupId: string,
	assignedDate: Date,
	roadmap: RoadmapKey
) => {
	const problem = await pickProblemForDate(assignedDate, roadmap)
	if (!problem) return null

	return db.dailyProblem.upsert({
		where: { groupId_assignedDate: { groupId, assignedDate } },
		create: { groupId, assignedDate, problemId: problem.id },
		update: {},
		select: {
			id: true,
			assignedDate: true,
			firstSolveTime: true,
			group: { select: { id: true, slug: true, roadmap: true } },
			problem: { select: problemSelect },
			solves: {
				select: {
					id: true,
					status: true,
					pointsEarned: true,
					isFirstInGroup: true,
					createdAt: true,
					verifiedAt: true,
				},
			},
		},
	})
}

const findPrimaryGroup = (userId: string) =>
	db.groupMember.findFirst({
		where: { userId, group: { isActive: true } },
		orderBy: { joinedAt: "asc" },
		select: {
			group: {
				select: {
					id: true,
					slug: true,
					roadmap: true,
				},
			},
		},
	})

const getUserPauseSummary = async (userId: string) => {
	const user = await db.user.findUniqueOrThrow({
		where: { id: userId },
		select: { isPro: true, pausesUsedThisMonth: true },
	})

	return {
		user,
		pausesRemaining: Math.max(0, pauseLimitFor(user) - user.pausesUsedThisMonth),
	}
}

export const problemsDao = {
	seedStarterProblems: async () => {
		const BATCH = 50
		let seeded = 0

		for (let i = 0; i < NEETCODE_250_PROBLEMS.length; i += BATCH) {
			const batch = NEETCODE_250_PROBLEMS.slice(i, i + BATCH)
			const results = await db.$transaction(
				batch.map((problem) => {
					const data = { ...problem, topics: [...problem.topics] }
					return db.problem.upsert({
						where: { slug: problem.slug },
						create: data,
						update: data,
					})
				})
			)
			seeded += results.length
		}

		return { seeded }
	},

	getTodayForUser: async (userId: string): Promise<TodayProblemResponse> => {
		const [{ pausesRemaining }, membership] = await Promise.all([
			getUserPauseSummary(userId),
			findPrimaryGroup(userId),
		])

		if (!membership) {
			return {
				state: "NO_GROUP",
				group: null,
				dailyProblem: null,
				solve: null,
				pausesRemaining,
			}
		}

		const dailyProblem = await ensureDailyProblem(
			membership.group.id,
			startOfTodayUtc(),
			membership.group.roadmap
		)
		if (!dailyProblem) {
			return {
				state: "NO_PROBLEMS",
				group: null,
				dailyProblem: null,
				solve: null,
				pausesRemaining,
			}
		}

		const solve = await db.userSolve.findUnique({
			where: { userId_dailyProblemId: { userId, dailyProblemId: dailyProblem.id } },
			select: {
				id: true,
				status: true,
				pointsEarned: true,
				isFirstInGroup: true,
				createdAt: true,
				verifiedAt: true,
			},
		})

		return {
			state: "READY",
			group: dailyProblem.group,
			groupRoadmap: dailyProblem.group.roadmap,
			dailyProblem: {
				id: dailyProblem.id,
				assignedDate: dailyProblem.assignedDate,
				firstSolveTime: dailyProblem.firstSolveTime,
				group: dailyProblem.group,
				problem: dailyProblem.problem,
			},
			solve,
			pausesRemaining,
		}
	},

	markTodaySolved: async (userId: string): Promise<MarkSolvedResult> => {
		const today = await problemsDao.getTodayForUser(userId)
		if (today.state !== "READY") return { error: today.state, today }

		const existing = today.solve
		if (existing?.status === SolveStatus.PAUSED) {
			return { error: "PAUSED", today }
		}
		if (
			existing?.status === SolveStatus.SOLVED ||
			existing?.status === SolveStatus.PENDING_VERIFICATION
		) {
			return { error: null, today }
		}

		await db.userSolve.upsert({
			where: {
				userId_dailyProblemId: {
					userId,
					dailyProblemId: today.dailyProblem.id,
				},
			},
			create: {
				userId,
				dailyProblemId: today.dailyProblem.id,
				status: SolveStatus.PENDING_VERIFICATION,
			},
			update: {
				status: SolveStatus.PENDING_VERIFICATION,
			},
		})

		return { error: null, today: await problemsDao.getTodayForUser(userId) }
	},

	pauseToday: async (userId: string): Promise<PauseTodayResult> => {
		const today = await problemsDao.getTodayForUser(userId)
		if (today.state !== "READY") return { error: today.state, today }
		if (today.solve?.status === SolveStatus.PAUSED) return { error: null, today }
		if (
			today.solve?.status === SolveStatus.SOLVED ||
			today.solve?.status === SolveStatus.PENDING_VERIFICATION
		) {
			return { error: "ALREADY_STARTED", today }
		}

		const { pausesRemaining } = await getUserPauseSummary(userId)
		if (pausesRemaining <= 0) {
			return { error: "NO_PAUSES", today }
		}

		await db.$transaction([
			db.userSolve.upsert({
				where: {
					userId_dailyProblemId: {
						userId,
						dailyProblemId: today.dailyProblem.id,
					},
				},
				create: {
					userId,
					dailyProblemId: today.dailyProblem.id,
					status: SolveStatus.PAUSED,
				},
				update: { status: SolveStatus.PAUSED },
			}),
			db.user.update({
				where: { id: userId },
				data: { pausesUsedThisMonth: { increment: 1 } },
			}),
		])

		return { error: null, today: await problemsDao.getTodayForUser(userId) }
	},

	getRoadmapForUser: async (
		userId: string,
		roadmap: RoadmapKey = "NC250"
	): Promise<RoadmapProblemResponse[]> => {
		const [problems, solves] = await Promise.all([
			db.problem.findMany({
				where: roadmapFilter(roadmap),
				orderBy: { roadmapIndex: "asc" },
				select: problemSelect,
			}),
			db.userSolve.findMany({
				where: { userId },
				select: {
					status: true,
					dailyProblem: { select: { problemId: true } },
				},
				orderBy: { updatedAt: "desc" },
			}),
		])

		const statusByProblemId = new Map<string, SolveStatus>()
		for (const solve of solves) {
			if (!statusByProblemId.has(solve.dailyProblem.problemId)) {
				statusByProblemId.set(solve.dailyProblem.problemId, solve.status)
			}
		}

		return problems.map((problem) => ({
			...problem,
			status: statusByProblemId.get(problem.id) ?? "UNSOLVED",
		}))
	},
}
