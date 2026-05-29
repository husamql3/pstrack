import type { Prisma } from "@/generated/prisma/client"
import { PointReason, SolveStatus } from "@/generated/prisma/enums"
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

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql"

const verifyLeetCodeSubmission = async (
	handle: string,
	problemSlug: string,
	assignedDate: Date
): Promise<boolean> => {
	try {
		const res = await fetch(LEETCODE_GRAPHQL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: `query recentAcSubmissions($username: String!, $limit: Int!) {
          recentAcSubmissionList(username: $username, limit: $limit) {
            titleSlug
            timestamp
          }
        }`,
				variables: { username: handle, limit: 20 },
			}),
		})
		const json = (await res.json()) as {
			data?: { recentAcSubmissionList?: Array<{ titleSlug: string; timestamp: string }> }
		}
		const submissions = json.data?.recentAcSubmissionList ?? []
		const assignedTimestampSeconds = assignedDate.getTime() / 1000
		return submissions.some(
			(s) =>
				s.titleSlug === problemSlug && Number(s.timestamp) >= assignedTimestampSeconds
		)
	} catch {
		return false
	}
}

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
	assignDailyProblems: async (date: Date) => {
		const groups = await db.group.findMany({
			where: { isActive: true },
			select: { id: true, roadmap: true },
		})

		let assigned = 0
		let skipped = 0

		await Promise.all(
			groups.map(async (group) => {
				const result = await ensureDailyProblem(group.id, date, group.roadmap)
				if (result) assigned++
				else skipped++
			})
		)

		return { total: groups.length, assigned, skipped }
	},

	seedStarterProblems: async () => {
		const BATCH = 50
		let seeded = 0

		for (let i = 0; i < NEETCODE_250_PROBLEMS.length; i += BATCH) {
			const batch = NEETCODE_250_PROBLEMS.slice(i, i + BATCH)
			const results = await db.$transaction(
				batch.map((problem) =>
					db.problem.upsert({
						where: { slug: problem.slug },
						create: problem,
						update: problem,
					})
				)
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

	verifyAndMarkSolved: async (userId: string): Promise<MarkSolvedResult> => {
		const today = await problemsDao.getTodayForUser(userId)
		if (today.state !== "READY") return { error: today.state, today }

		const existing = today.solve
		if (existing?.status === SolveStatus.PAUSED) return { error: "PAUSED", today }
		if (existing?.status === SolveStatus.SOLVED) return { error: null, today }

		const { id: dailyProblemId, assignedDate, problem } = today.dailyProblem

		const user = await db.user.findUniqueOrThrow({
			where: { id: userId },
			select: { leetcodeHandle: true, currentStreak: true, longestStreak: true },
		})

		if (!user.leetcodeHandle) return { error: "NOT_VERIFIED", today }

		const verified = await verifyLeetCodeSubmission(
			user.leetcodeHandle,
			problem.slug,
			assignedDate
		)
		if (!verified) return { error: "NOT_VERIFIED", today }

		const existingSolvedCount = await db.userSolve.count({
			where: { dailyProblemId, status: SolveStatus.SOLVED },
		})
		const isFirstInGroup = existingSolvedCount === 0

		const BASE_POINTS = 10
		const FIRST_BONUS = 5
		const pointsEarned = BASE_POINTS + (isFirstInGroup ? FIRST_BONUS : 0)
		const newStreak = user.currentStreak + 1
		const newLongest = Math.max(newStreak, user.longestStreak)
		const now = new Date()

		await db.$transaction(async (tx) => {
			const upserted = await tx.userSolve.upsert({
				where: { userId_dailyProblemId: { userId, dailyProblemId } },
				create: {
					userId,
					dailyProblemId,
					status: SolveStatus.SOLVED,
					pointsEarned,
					isFirstInGroup,
					verifiedAt: now,
				},
				update: {
					status: SolveStatus.SOLVED,
					pointsEarned,
					isFirstInGroup,
					verifiedAt: now,
				},
			})

			const ops: Promise<unknown>[] = [
				tx.pointsHistory.create({
					data: {
						userId,
						userSolveId: upserted.id,
						delta: BASE_POINTS,
						reason: PointReason.DAILY_SOLVE,
					},
				}),
				tx.user.update({
					where: { id: userId },
					data: {
						totalPoints: { increment: pointsEarned },
						currentStreak: newStreak,
						longestStreak: newLongest,
					},
				}),
			]

			if (isFirstInGroup) {
				ops.push(
					tx.pointsHistory.create({
						data: {
							userId,
							userSolveId: upserted.id,
							delta: FIRST_BONUS,
							reason: PointReason.FIRST_IN_GROUP,
						},
					}),
					tx.dailyProblem.update({
						where: { id: dailyProblemId },
						data: { firstSolverId: userId, firstSolveTime: now },
					})
				)
			}

			await Promise.all(ops)
		})

		return { error: null, today: await problemsDao.getTodayForUser(userId) }
	},

	pauseToday: async (userId: string): Promise<PauseTodayResult> => {
		const today = await problemsDao.getTodayForUser(userId)
		if (today.state !== "READY") return { error: today.state, today }
		if (today.solve?.status === SolveStatus.PAUSED) return { error: null, today }
		if (today.solve?.status === SolveStatus.SOLVED) {
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
