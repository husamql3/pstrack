import type { Prisma } from "@/generated/prisma/client"
import { Difficulty, PointReason, SolveStatus } from "@/generated/prisma/enums"
import { badgesDao } from "@/server/badges/badges.dao"
import { db } from "@/server/lib/db"
import { pointsDao } from "@/server/points/points.dao"
import {
	COMEBACK_BONUS,
	EARLY_BIRD_BONUS,
	EARLY_BIRD_WINDOW_MS,
	FIRST_IN_GROUP_BONUS,
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

type LeetCodeVerifyResult = { matched: false } | { matched: true; submittedAt: Date }

const verifyLeetCodeSubmission = async (
	handle: string,
	problemSlug: string,
	assignedDate: Date
): Promise<LeetCodeVerifyResult> => {
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
		const match = submissions.find(
			(s) =>
				s.titleSlug === problemSlug && Number(s.timestamp) >= assignedTimestampSeconds
		)
		if (!match) return { matched: false }
		return { matched: true, submittedAt: new Date(Number(match.timestamp) * 1000) }
	} catch {
		return { matched: false }
	}
}

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

const dailyProblemFullSelect = {
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
} satisfies Prisma.DailyProblemSelect

const findExistingDailyProblem = (groupId: string, assignedDate: Date) =>
	db.dailyProblem.findUnique({
		where: { groupId_assignedDate: { groupId, assignedDate } },
		select: dailyProblemFullSelect,
	})

type Tx = Prisma.TransactionClient

const assignNextProblemTx = async (
	tx: Tx,
	groupId: string,
	assignedDate: Date
): Promise<Prisma.DailyProblemGetPayload<{
	select: typeof dailyProblemFullSelect
}> | null> => {
	const group = await tx.group.findUniqueOrThrow({
		where: { id: groupId },
		select: { roadmap: true, roadmapIndex: true },
	})

	const filter = roadmapFilter(group.roadmap)
	const count = await tx.problem.count({ where: filter })
	const nextIndex = group.roadmapIndex + 1
	if (nextIndex > count) return null

	const problem = await tx.problem.findFirst({
		where: filter,
		orderBy: { roadmapIndex: "asc" },
		skip: nextIndex - 1,
		select: { id: true },
	})
	if (!problem) return null

	const dailyProblem = await tx.dailyProblem.create({
		data: { groupId, assignedDate, problemId: problem.id },
		select: dailyProblemFullSelect,
	})

	await tx.group.update({
		where: { id: groupId },
		data: { roadmapIndex: nextIndex },
	})

	return dailyProblem
}

const ensureDailyProblem = async (groupId: string, assignedDate: Date) => {
	const existing = await findExistingDailyProblem(groupId, assignedDate)
	if (existing) return existing

	try {
		return await db.$transaction((tx) => assignNextProblemTx(tx, groupId, assignedDate))
	} catch (err) {
		if (
			err &&
			typeof err === "object" &&
			"code" in err &&
			(err as { code?: string }).code === "P2002"
		) {
			return findExistingDailyProblem(groupId, assignedDate)
		}
		throw err
	}
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

	const pausesTotal = pauseLimitFor(user)

	return {
		user,
		pausesRemaining: Math.max(0, pausesTotal - user.pausesUsedThisMonth),
		pausesTotal,
		userStats: {
			currentStreak: user.currentStreak,
			longestStreak: user.longestStreak,
			totalPoints: user.totalPoints,
		},
	}
}

const getGroupRank = async (groupId: string, userTotalPoints: number) => {
	const [higherRanked, groupSize] = await Promise.all([
		db.groupMember.count({
			where: { groupId, user: { totalPoints: { gt: userTotalPoints } } },
		}),
		db.groupMember.count({ where: { groupId } }),
	])
	return { groupRank: higherRanked + 1, groupSize }
}

export const problemsDao = {
	assignDailyProblems: async (date: Date) => {
		const groups = await db.group.findMany({
			where: { isActive: true },
			select: { id: true },
		})

		let assigned = 0
		let skipped = 0

		await Promise.all(
			groups.map(async (group) => {
				const result = await ensureDailyProblem(group.id, date)
				if (result) assigned++
				else skipped++
			})
		)

		return { total: groups.length, assigned, skipped }
	},

	ensureDailyProblemForGroup: (groupId: string, assignedDate: Date) =>
		ensureDailyProblem(groupId, assignedDate),

	assignNextProblemTx,

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
		const BATCH = 20
		let seeded = 0
		let skipped = 0

		const customSlugs = new Set(
			(
				await db.problem.findMany({
					where: { source: "CUSTOM" },
					select: { slug: true },
				})
			).map((p) => p.slug)
		)

		for (let i = 0; i < NEETCODE_250_PROBLEMS.length; i += BATCH) {
			const batch = NEETCODE_250_PROBLEMS.slice(i, i + BATCH)
			const writable = batch.filter((p) => {
				if (customSlugs.has(p.slug)) {
					skipped += 1
					return false
				}
				return true
			})
			const results = await Promise.all(
				writable.map((problem) =>
					db.problem.upsert({
						where: { slug: problem.slug },
						create: problem,
						update: problem,
					})
				)
			)
			seeded += results.length
		}

		return { seeded, skipped }
	},

	getTodayForUser: async (userId: string): Promise<TodayProblemResponse> => {
		const [{ pausesRemaining, pausesTotal, userStats }, membership] = await Promise.all([
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
				pausesTotal,
				groupRank: null,
				groupSize: null,
				userStats,
			}
		}

		const [dailyProblem, { groupRank, groupSize }] = await Promise.all([
			ensureDailyProblem(membership.group.id, startOfTodayUtc()),
			getGroupRank(membership.group.id, userStats.totalPoints),
		])

		if (!dailyProblem) {
			return {
				state: "NO_PROBLEMS",
				group: null,
				dailyProblem: null,
				solve: null,
				pausesRemaining,
				pausesTotal,
				groupRank: null,
				groupSize: null,
				userStats,
			}
		}

		const [solve, groupSolvedCount] = await Promise.all([
			db.userSolve.findUnique({
				where: { userId_dailyProblemId: { userId, dailyProblemId: dailyProblem.id } },
				select: {
					id: true,
					status: true,
					pointsEarned: true,
					isFirstInGroup: true,
					createdAt: true,
					verifiedAt: true,
				},
			}),
			db.userSolve.count({
				where: { dailyProblemId: dailyProblem.id, status: SolveStatus.SOLVED },
			}),
		])

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
			pausesTotal,
			groupRank,
			groupSize,
			groupSolvedCount,
			userStats,
		}
	},

	verifyAndMarkSolved: async (userId: string): Promise<MarkSolvedResult> => {
		const today = await problemsDao.getTodayForUser(userId)
		if (today.state !== "READY") return { error: today.state, today }

		const existing = today.solve
		if (existing?.status === SolveStatus.PAUSED) return { error: "PAUSED", today }
		if (existing?.status === SolveStatus.SOLVED) {
			return {
				error: null,
				today,
				crossedProThreshold: false,
				newBadges: [],
				newStreak: today.userStats.currentStreak,
			}
		}

		const { id: dailyProblemId, assignedDate, problem } = today.dailyProblem

		const user = await db.user.findUniqueOrThrow({
			where: { id: userId },
			select: {
				leetcodeHandle: true,
				currentStreak: true,
				longestStreak: true,
				currentStreakStartedAt: true,
				verificationFailuresThisMonth: true,
			},
		})

		if (!user.leetcodeHandle) return { error: "NOT_VERIFIED", today }

		const verifyResult = await verifyLeetCodeSubmission(
			user.leetcodeHandle,
			problem.slug,
			assignedDate
		)

		if (!verifyResult.matched) {
			const failuresNow = user.verificationFailuresThisMonth + 1
			const isGrace = user.verificationFailuresThisMonth === 0

			await db.$transaction(async (tx) => {
				await tx.user.update({
					where: { id: userId },
					data: { verificationFailuresThisMonth: failuresNow },
				})

				if (isGrace) {
					await pointsDao.applyPointsDelta(
						userId,
						0,
						PointReason.VERIFICATION_FAILURE_GRACE,
						{ tx }
					)
				} else {
					const solve = await tx.userSolve.upsert({
						where: { userId_dailyProblemId: { userId, dailyProblemId } },
						create: {
							userId,
							dailyProblemId,
							status: SolveStatus.MISSED,
							pointsEarned: 0,
						},
						update: { status: SolveStatus.MISSED },
						select: { id: true },
					})
					await pointsDao.applyMissPenalty(tx, userId, {
						userSolveId: solve.id,
						streakStartedAt: user.currentStreakStartedAt,
					})
				}
			})

			if (isGrace) return { error: "NOT_VERIFIED", today }
			return {
				error: "VERIFICATION_FAILED_PENALIZED",
				today: await problemsDao.getTodayForUser(userId),
			}
		}

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
		const submittedAt = verifyResult.submittedAt
		const isEarlyBird =
			submittedAt.getTime() - assignedDate.getTime() < EARLY_BIRD_WINDOW_MS
		const isNewStreak = user.currentStreak === 0
		const newStreak = user.currentStreak + 1
		const newLongest = Math.max(newStreak, user.longestStreak)

		const { crossedProThreshold, newBadges } = await db.$transaction(async (tx) => {
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
			let crossedPro = false

			const r0 = await pointsDao.applyPointsDelta(
				userId,
				baseSolvePoints,
				PointReason.DAILY_SOLVE,
				opts
			)
			crossedPro ||= r0.crossedProThreshold

			if (multiplierDelta > 0) {
				const r1 = await pointsDao.applyPointsDelta(
					userId,
					multiplierDelta,
					PointReason.STREAK_MULTIPLIER_BONUS,
					opts
				)
				crossedPro ||= r1.crossedProThreshold
			}

			if (isFirstInGroup) {
				const r2 = await pointsDao.applyPointsDelta(
					userId,
					FIRST_IN_GROUP_BONUS,
					PointReason.FIRST_IN_GROUP,
					opts
				)
				crossedPro ||= r2.crossedProThreshold
				await tx.dailyProblem.update({
					where: { id: dailyProblemId },
					data: { firstSolverId: userId, firstSolveTime: now },
				})
			}

			if (isComeback) {
				const r3 = await pointsDao.applyPointsDelta(
					userId,
					COMEBACK_BONUS,
					PointReason.COMEBACK,
					opts
				)
				crossedPro ||= r3.crossedProThreshold
			}

			if (isEarlyBird) {
				const r4 = await pointsDao.applyPointsDelta(
					userId,
					EARLY_BIRD_BONUS,
					PointReason.EARLY_BIRD,
					opts
				)
				crossedPro ||= r4.crossedProThreshold
			}

			await tx.user.update({
				where: { id: userId },
				data: {
					currentStreak: newStreak,
					longestStreak: newLongest,
					...(isNewStreak && { currentStreakStartedAt: now }),
				},
			})

			const awarded = await badgesDao.evaluateAndAward(tx, userId, newStreak)

			return { crossedProThreshold: crossedPro, newBadges: awarded }
		})

		return {
			error: null,
			today: await problemsDao.getTodayForUser(userId),
			crossedProThreshold,
			newBadges,
			newStreak,
		}
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

				await pointsDao.applyMissPenalty(tx, userId, {
					userSolveId: solve.id,
					streakStartedAt: streakStartByUser.get(userId) ?? null,
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
