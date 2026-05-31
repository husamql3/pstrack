import type { Prisma } from "@/generated/prisma/client"
import { Difficulty, PointReason, SolveStatus } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { pointsDao } from "@/server/points/points.dao"
import {
	COMEBACK_BONUS,
	EARLY_BIRD_BONUS,
	FIRST_IN_GROUP_BONUS,
	MISSED_PENALTY,
	PAUSE_PENALTY,
	SOLVE_POINTS,
	STREAK_MULTIPLIER_7,
	STREAK_MULTIPLIER_30,
} from "@/server/points/points.type"
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

const startOfUtcDay = (d: Date) =>
	new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

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

const getUserDashboardContext = async (userId: string) => {
	const user = await db.user.findUniqueOrThrow({
		where: { id: userId },
		select: {
			isPro: true,
			pausesUsedThisMonth: true,
			currentStreak: true,
			longestStreak: true,
			totalPoints: true,
		},
	})

	return {
		user,
		pausesRemaining: Math.max(0, pauseLimitFor(user) - user.pausesUsedThisMonth),
		userStats: {
			currentStreak: user.currentStreak,
			longestStreak: user.longestStreak,
			totalPoints: user.totalPoints,
		},
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

	getDailyDigestRecipients: async (date: Date) => {
		const day = startOfUtcDay(date)

		const memberships = await db.groupMember.findMany({
			where: { joinedAt: { lt: day }, group: { isActive: true } },
			orderBy: [{ userId: "asc" }, { joinedAt: "asc" }],
			select: { groupId: true, userId: true },
		})

		const primaryByUser = new Map<string, string>()
		for (const m of memberships) {
			if (!primaryByUser.has(m.userId)) primaryByUser.set(m.userId, m.groupId)
		}
		if (primaryByUser.size === 0) return []

		const groupIds = Array.from(new Set(primaryByUser.values()))
		const dailyProblems = await db.dailyProblem.findMany({
			where: { groupId: { in: groupIds }, assignedDate: day },
			select: {
				id: true,
				groupId: true,
				group: { select: { slug: true } },
				problem: { select: { slug: true, title: true, difficulty: true, topic: true } },
			},
		})
		const dailyByGroup = new Map(dailyProblems.map((dp) => [dp.groupId, dp]))

		const userIds = Array.from(primaryByUser.keys())
		const users = await db.user.findMany({
			where: { id: { in: userIds }, notifyDailyProblem: true },
			select: { id: true, email: true, name: true },
		})

		return users.flatMap((u) => {
			const groupId = primaryByUser.get(u.id)
			if (!groupId) return []
			const dp = dailyByGroup.get(groupId)
			if (!dp) return []
			return [
				{
					email: u.email,
					name: u.name,
					groupSlug: dp.group.slug,
					problemSlug: dp.problem.slug,
					problemTitle: dp.problem.title,
					difficulty: dp.problem.difficulty,
					topic: dp.problem.topic,
				},
			]
		})
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
		const [{ pausesRemaining, userStats }, membership] = await Promise.all([
			getUserDashboardContext(userId),
			findPrimaryGroup(userId),
		])

		if (!membership) {
			return {
				state: "NO_GROUP",
				group: null,
				dailyProblem: null,
				solve: null,
				pausesRemaining,
				userStats,
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
				userStats,
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
			userStats,
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
			select: {
				leetcodeHandle: true,
				currentStreak: true,
				longestStreak: true,
				currentStreakStartedAt: true,
			},
		})

		if (!user.leetcodeHandle) return { error: "NOT_VERIFIED", today }

		const verified = await verifyLeetCodeSubmission(
			user.leetcodeHandle,
			problem.slug,
			assignedDate
		)
		if (!verified) return { error: "NOT_VERIFIED", today }

		const [existingSolvedCount, isComeback] = await Promise.all([
			db.userSolve.count({ where: { dailyProblemId, status: SolveStatus.SOLVED } }),
			user.currentStreak === 0 ? pointsDao.hasEverMissed(userId) : Promise.resolve(false),
		])

		const isFirstInGroup = existingSolvedCount === 0
		const baseSolvePoints =
			problem.difficulty === Difficulty.HARD
				? SOLVE_POINTS.HARD
				: problem.difficulty === Difficulty.MEDIUM
					? SOLVE_POINTS.MEDIUM
					: SOLVE_POINTS.EASY

		const multiplier =
			user.currentStreak >= 30
				? STREAK_MULTIPLIER_30
				: user.currentStreak >= 7
					? STREAK_MULTIPLIER_7
					: 1
		const multiplierDelta = Math.floor(baseSolvePoints * multiplier) - baseSolvePoints

		const now = new Date()
		const isEarlyBird = now.getUTCHours() < 12
		const isNewStreak = user.currentStreak === 0
		const newStreak = user.currentStreak + 1
		const newLongest = Math.max(newStreak, user.longestStreak)

		await db.$transaction(async (tx) => {
			const upserted = await tx.userSolve.upsert({
				where: { userId_dailyProblemId: { userId, dailyProblemId } },
				create: {
					userId,
					dailyProblemId,
					status: SolveStatus.SOLVED,
					pointsEarned: baseSolvePoints,
					isFirstInGroup,
					verifiedAt: now,
				},
				update: {
					status: SolveStatus.SOLVED,
					pointsEarned: baseSolvePoints,
					isFirstInGroup,
					verifiedAt: now,
				},
				select: { id: true },
			})

			const opts = { tx, userSolveId: upserted.id }

			await pointsDao.applyPointsDelta(
				userId,
				baseSolvePoints,
				PointReason.DAILY_SOLVE,
				opts
			)

			if (multiplierDelta > 0) {
				await pointsDao.applyPointsDelta(
					userId,
					multiplierDelta,
					PointReason.STREAK_MULTIPLIER_BONUS,
					opts
				)
			}

			if (isFirstInGroup) {
				await pointsDao.applyPointsDelta(
					userId,
					FIRST_IN_GROUP_BONUS,
					PointReason.FIRST_IN_GROUP,
					opts
				)
				await tx.dailyProblem.update({
					where: { id: dailyProblemId },
					data: { firstSolverId: userId, firstSolveTime: now },
				})
			}

			if (isComeback) {
				await pointsDao.applyPointsDelta(
					userId,
					COMEBACK_BONUS,
					PointReason.COMEBACK,
					opts
				)
			}

			if (isEarlyBird) {
				await pointsDao.applyPointsDelta(
					userId,
					EARLY_BIRD_BONUS,
					PointReason.EARLY_BIRD,
					opts
				)
			}

			await tx.user.update({
				where: { id: userId },
				data: {
					currentStreak: newStreak,
					longestStreak: newLongest,
					...(isNewStreak && { currentStreakStartedAt: now }),
				},
			})
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

		const { pausesRemaining } = await getUserDashboardContext(userId)
		if (pausesRemaining <= 0) {
			return { error: "NO_PAUSES", today }
		}

		await db.$transaction(async (tx) => {
			const upserted = await tx.userSolve.upsert({
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
				select: { id: true },
			})

			await tx.user.update({
				where: { id: userId },
				data: { pausesUsedThisMonth: { increment: 1 } },
			})

			await pointsDao.applyPointsDelta(userId, -PAUSE_PENALTY, PointReason.PAUSE, {
				tx,
				userSolveId: upserted.id,
			})
		})

		return { error: null, today: await problemsDao.getTodayForUser(userId) }
	},

	markMissedForDate: async (referenceDate: Date) => {
		const day = startOfUtcDay(referenceDate)

		const memberships = await db.groupMember.findMany({
			where: {
				joinedAt: { lt: day },
				group: { isActive: true },
			},
			orderBy: [{ userId: "asc" }, { joinedAt: "asc" }],
			select: { groupId: true, userId: true },
		})

		const primaryByUser = new Map<string, string>()
		for (const m of memberships) {
			if (!primaryByUser.has(m.userId)) primaryByUser.set(m.userId, m.groupId)
		}
		if (primaryByUser.size === 0) return { missed: 0 }

		const groupIds = Array.from(new Set(primaryByUser.values()))
		const dailyProblems = await db.dailyProblem.findMany({
			where: { groupId: { in: groupIds }, assignedDate: day },
			select: { id: true, groupId: true },
		})
		const dailyByGroup = new Map(dailyProblems.map((dp) => [dp.groupId, dp.id]))

		const candidates: { userId: string; dailyProblemId: string }[] = []
		for (const [userId, groupId] of primaryByUser) {
			const dpId = dailyByGroup.get(groupId)
			if (dpId) candidates.push({ userId, dailyProblemId: dpId })
		}
		if (candidates.length === 0) return { missed: 0 }

		const userIds = Array.from(new Set(candidates.map((c) => c.userId)))
		const dailyProblemIds = Array.from(new Set(candidates.map((c) => c.dailyProblemId)))

		const [existingSolves, usersWithStreak] = await Promise.all([
			db.userSolve.findMany({
				where: { userId: { in: userIds }, dailyProblemId: { in: dailyProblemIds } },
				select: { userId: true, dailyProblemId: true },
			}),
			db.user.findMany({
				where: { id: { in: userIds } },
				select: { id: true, currentStreakStartedAt: true },
			}),
		])

		const existingKey = new Set(
			existingSolves.map((s) => `${s.userId}:${s.dailyProblemId}`)
		)
		const streakStartByUser = new Map(
			usersWithStreak.map((u) => [u.id, u.currentStreakStartedAt])
		)

		const toMiss = candidates.filter(
			(c) => !existingKey.has(`${c.userId}:${c.dailyProblemId}`)
		)
		if (toMiss.length === 0) return { missed: 0 }

		await db.$transaction(async (tx) => {
			for (const { userId, dailyProblemId } of toMiss) {
				const solve = await tx.userSolve.create({
					data: { userId, dailyProblemId, status: SolveStatus.MISSED, pointsEarned: 0 },
					select: { id: true },
				})

				const solveOpts = { tx, userSolveId: solve.id }
				const streakStartedAt = streakStartByUser.get(userId) ?? null

				if (streakStartedAt) {
					const bonusSum = await pointsDao.sumBonusesSinceStreakStart(
						tx,
						userId,
						streakStartedAt
					)
					if (bonusSum > 0) {
						await pointsDao.applyPointsDelta(
							userId,
							-bonusSum,
							PointReason.CLAWBACK,
							solveOpts
						)
					}
				}

				await pointsDao.applyPointsDelta(
					userId,
					-MISSED_PENALTY,
					PointReason.MISSED_DAY,
					solveOpts
				)

				await tx.user.update({
					where: { id: userId },
					data: { currentStreak: 0, currentStreakStartedAt: null },
				})
			}
		})

		return { missed: toMiss.length }
	},

	resetMonthlyCounters: async () => {
		const result = await db.user.updateMany({
			where: {
				OR: [
					{ pausesUsedThisMonth: { gt: 0 } },
					{ verificationFailuresThisMonth: { gt: 0 } },
				],
			},
			data: { pausesUsedThisMonth: 0, verificationFailuresThisMonth: 0 },
		})
		return { reset: result.count }
	},

	getRoadmapForUser: async (
		userId: string | null,
		roadmap: RoadmapKey = "NC250"
	): Promise<RoadmapProblemResponse[]> => {
		const [problems, solves] = await Promise.all([
			db.problem.findMany({
				where: roadmapFilter(roadmap),
				orderBy: { roadmapIndex: "asc" },
				select: problemSelect,
			}),
			userId
				? db.userSolve.findMany({
						where: { userId },
						select: {
							status: true,
							dailyProblem: { select: { problemId: true } },
						},
						orderBy: { updatedAt: "desc" },
					})
				: Promise.resolve([]),
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
