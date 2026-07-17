import type { Prisma } from "@/generated/prisma/client"
import {
	type BadgeType,
	Difficulty,
	GroupMemberRemovalReason,
	GroupMemberStatus,
	GroupType,
	MemberRole,
	PointReason,
	SolveStatus,
	SystemEventType,
	WarningResolution,
} from "@/generated/prisma/enums"
import { badgesDao } from "@/server/badges/badges.dao"
import { groupNotifications } from "@/server/groups/groups.notifications"
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
import { syncRoadmapCatalog } from "./problems.roadmap"
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
const INACTIVITY_WARNING_MISSES = 5
const BATCH_SIZE = 25

// Multi-group daily solving (per-group problems for users in >1 group) went live on
// this date. mark-missed only evaluates non-primary groups for days on/after the
// cutover — its 14-day catch-up must never retroactively mark MISSED for groups the
// pre-multi-group code silently ignored. Set to the production deploy date.
const MULTI_GROUP_CUTOVER_DATE = new Date("2026-07-17T00:00:00.000Z")

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

const startedActiveGroupWhere = { isActive: true, isStarted: true }

type DailyProblemFull = Prisma.DailyProblemGetPayload<{
	select: typeof dailyProblemFullSelect
}>

type Tx = Prisma.TransactionClient

const applyRoadmapMetadata = (
	dailyProblem: DailyProblemFull,
	roadmapProblem: { position: number; topic: string | null } | null
): DailyProblemFull => ({
	...dailyProblem,
	problem: {
		...dailyProblem.problem,
		roadmapIndex: roadmapProblem?.position ?? dailyProblem.problem.roadmapIndex,
		topic: roadmapProblem?.topic ?? dailyProblem.problem.topic,
	},
})

const withRoadmapMetadata = async (
	dailyProblem: DailyProblemFull | null
): Promise<DailyProblemFull | null> => {
	if (!dailyProblem) return null

	const roadmapProblem = await db.roadmapProblem.findFirst({
		where: {
			problemId: dailyProblem.problem.id,
			roadmap: { key: dailyProblem.group.roadmap },
		},
		select: { position: true, topic: true },
	})

	return applyRoadmapMetadata(dailyProblem, roadmapProblem)
}

const findExistingDailyProblem = async (groupId: string, assignedDate: Date) =>
	withRoadmapMetadata(
		await db.dailyProblem.findUnique({
			where: { groupId_assignedDate: { groupId, assignedDate } },
			select: dailyProblemFullSelect,
		})
	)

const assignNextProblemTx = async (
	tx: Tx,
	groupId: string,
	assignedDate: Date
): Promise<DailyProblemFull | null> => {
	const group = await tx.group.findUniqueOrThrow({
		where: { id: groupId },
		select: { roadmap: true, roadmapIndex: true },
	})

	const latestAssigned = await tx.roadmapProblem.findFirst({
		where: {
			roadmap: { key: group.roadmap },
			problem: { dailyProblems: { some: { groupId } } },
		},
		orderBy: { position: "desc" },
		select: { position: true },
	})
	const lowerBound = Math.max(group.roadmapIndex, latestAssigned?.position ?? 0)

	const roadmapProblem = await tx.roadmapProblem.findFirst({
		where: {
			roadmap: { key: group.roadmap },
			position: { gt: lowerBound },
			problem: { isPremium: false },
		},
		orderBy: { position: "asc" },
		select: { problemId: true, position: true, topic: true },
	})
	if (!roadmapProblem) return null

	const dailyProblem = await tx.dailyProblem.create({
		data: { groupId, assignedDate, problemId: roadmapProblem.problemId },
		select: dailyProblemFullSelect,
	})

	await tx.group.update({
		where: { id: groupId },
		data: { roadmapIndex: roadmapProblem.position },
	})

	return applyRoadmapMetadata(dailyProblem, roadmapProblem)
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

const membershipGroupSelect = {
	group: {
		select: {
			id: true,
			slug: true,
			roadmap: true,
			isStarted: true,
		},
	},
} satisfies Prisma.GroupMemberSelect

type MembershipGroup = Prisma.GroupMemberGetPayload<{
	select: typeof membershipGroupSelect
}>["group"]

const findPrimaryGroup = (userId: string) =>
	db.groupMember.findFirst({
		where: { userId, status: GroupMemberStatus.ACTIVE, group: { isActive: true } },
		orderBy: { joinedAt: "asc" },
		select: membershipGroupSelect,
	})

const findMembershipGroup = (userId: string, groupId: string) =>
	db.groupMember.findFirst({
		where: {
			userId,
			groupId,
			status: GroupMemberStatus.ACTIVE,
			group: { isActive: true },
		},
		select: membershipGroupSelect,
	})

// All the user's active memberships, oldest-joined first — the source list for the
// per-group dashboard. A user in N groups has N "today" problems.
const findActiveMembershipGroups = (userId: string) =>
	db.groupMember.findMany({
		where: { userId, status: GroupMemberStatus.ACTIVE, group: { isActive: true } },
		orderBy: { joinedAt: "asc" },
		select: membershipGroupSelect,
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
			where: {
				groupId,
				status: GroupMemberStatus.ACTIVE,
				user: { totalPoints: { gt: userTotalPoints } },
			},
		}),
		db.groupMember.count({ where: { groupId, status: GroupMemberStatus.ACTIVE } }),
	])
	return { groupRank: higherRanked + 1, groupSize }
}

const resolveActiveWarnings = async (
	tx: Tx,
	userId: string,
	groupId: string,
	resolution: WarningResolution
) => {
	const membership = await tx.groupMember.findUnique({
		where: { groupId_userId: { groupId, userId } },
		select: { id: true },
	})
	if (!membership) return
	await tx.groupMemberWarning.updateMany({
		where: { groupMemberId: membership.id, resolvedAt: null },
		data: { resolvedAt: new Date(), resolution },
	})
}

const countConsecutiveMisses = async (
	userId: string,
	groupId: string,
	throughDay: Date
) => {
	const solves = await db.userSolve.findMany({
		where: {
			userId,
			dailyProblem: { groupId, assignedDate: { lte: throughDay } },
		},
		orderBy: { dailyProblem: { assignedDate: "desc" } },
		select: { status: true },
	})

	let count = 0
	for (const solve of solves) {
		if (solve.status !== SolveStatus.MISSED) break
		count++
	}
	return count
}

const evaluateInactivityWarnings = async (
	primaryMemberships: Array<{
		id: string
		groupId: string
		userId: string
		role: MemberRole
		group: { type: GroupType }
	}>,
	throughDay: Date
) => {
	let warned = 0
	let removed = 0

	for (const membership of primaryMemberships) {
		if (membership.role !== MemberRole.MEMBER) continue

		const missedCount = await countConsecutiveMisses(
			membership.userId,
			membership.groupId,
			throughDay
		)
		if (missedCount < INACTIVITY_WARNING_MISSES) continue

		const activeWarning = await db.groupMemberWarning.findFirst({
			where: { groupMemberId: membership.id, resolvedAt: null },
			orderBy: { warnedAt: "desc" },
			select: { id: true, warningMissedCount: true },
		})

		if (!activeWarning) {
			await db.groupMemberWarning.create({
				data: {
					groupMemberId: membership.id,
					warningMissedCount: missedCount,
				},
			})
			groupNotifications.inactivityWarning(
				membership.groupId,
				membership.userId,
				missedCount,
				membership.group.type
			)
			warned++
			continue
		}

		if (
			membership.group.type !== GroupType.PUBLIC ||
			missedCount <= activeWarning.warningMissedCount
		) {
			continue
		}

		await db.$transaction(async (tx) => {
			await tx.groupMember.update({
				where: { id: membership.id },
				data: {
					status: GroupMemberStatus.REMOVED,
					removedAt: new Date(),
					removalReason: GroupMemberRemovalReason.AUTO_INACTIVITY,
				},
			})
			await tx.groupMemberWarning.update({
				where: { id: activeWarning.id },
				data: {
					resolvedAt: new Date(),
					resolution: WarningResolution.AUTO_REMOVED,
				},
			})
		})
		groupNotifications.memberRemoved(membership.groupId, membership.userId)
		removed++
	}

	return { warned, removed }
}

type DashboardContext = {
	pausesRemaining: number
	pausesTotal: number
	userStats: { currentStreak: number; longestStreak: number; totalPoints: number }
}

const noGroupToday = (ctx: DashboardContext): TodayProblemResponse => ({
	state: "NO_GROUP",
	group: null,
	dailyProblem: null,
	solve: null,
	pausesRemaining: ctx.pausesRemaining,
	pausesTotal: ctx.pausesTotal,
	groupRank: null,
	groupSize: null,
	userStats: ctx.userStats,
})

// Builds the "today" payload for a single group. Shared by getTodayForUser (one
// group) and listTodayForUser (all of the user's groups). User-level context
// (pauses, stats) is passed in so the list variant fetches it once, not per group.
const buildTodayForGroup = async (
	userId: string,
	group: MembershipGroup,
	ctx: DashboardContext
): Promise<TodayProblemResponse> => {
	const { pausesRemaining, pausesTotal, userStats } = ctx

	if (!group.isStarted) {
		const { groupRank, groupSize } = await getGroupRank(group.id, userStats.totalPoints)
		return {
			state: "NOT_STARTED",
			group: { id: group.id, slug: group.slug, roadmap: group.roadmap },
			groupRoadmap: group.roadmap,
			dailyProblem: null,
			solve: null,
			pausesRemaining,
			pausesTotal,
			groupRank,
			groupSize,
			userStats,
		}
	}

	const [dailyProblem, { groupRank, groupSize }] = await Promise.all([
		ensureDailyProblem(group.id, startOfTodayUtc()),
		getGroupRank(group.id, userStats.totalPoints),
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
}

// Has the user already recorded a SOLVED for any group today? Drives the
// once-per-day streak rule: the streak (and its multiplier/comeback bonuses)
// advance only on the first solve of the day, not per group.
const hasSolvedAnyToday = async (
	userId: string,
	day: Date,
	excludeDailyProblemId?: string
): Promise<boolean> => {
	const row = await db.userSolve.findFirst({
		where: {
			userId,
			status: SolveStatus.SOLVED,
			dailyProblem: { assignedDate: day },
			...(excludeDailyProblemId && { dailyProblemId: { not: excludeDailyProblemId } }),
		},
		select: { id: true },
	})
	return row !== null
}

export const problemsDao = {
	assignDailyProblems: async (date: Date) => {
		const groups = await db.group.findMany({
			where: startedActiveGroupWhere,
			select: { id: true },
		})

		let assigned = 0
		let skipped = 0

		for (let i = 0; i < groups.length; i += BATCH_SIZE) {
			const batch = groups.slice(i, i + BATCH_SIZE)
			const results = await Promise.all(
				batch.map((group) => ensureDailyProblem(group.id, date))
			)
			for (const result of results) {
				if (result) assigned++
				else skipped++
			}
		}

		return { total: groups.length, assigned, skipped }
	},

	ensureDailyProblemForGroup: (groupId: string, assignedDate: Date) =>
		ensureDailyProblem(groupId, assignedDate),

	assignNextProblemTx,

	getDailySolveStats: async (date: Date) => {
		const yesterday = new Date(date.getTime() - 86_400_000)
		const [
			totalSolves,
			solvers,
			newUsers,
			pausesUsed,
			handleChanges,
			misses,
			verificationFailures,
		] = await Promise.all([
			db.userSolve.count({
				where: {
					status: SolveStatus.SOLVED,
					dailyProblem: { assignedDate: yesterday },
				},
			}),
			db.userSolve.findMany({
				where: {
					status: SolveStatus.SOLVED,
					dailyProblem: { assignedDate: yesterday },
				},
				select: { userId: true },
				distinct: ["userId"],
			}),
			db.user.count({
				where: { createdAt: { gte: yesterday, lt: date } },
			}),
			db.systemEventLog.count({
				where: {
					eventType: SystemEventType.PAUSE_USED,
					createdAt: { gte: yesterday, lt: date },
				},
			}),
			db.systemEventLog.count({
				where: {
					eventType: {
						in: [SystemEventType.HANDLE_CHANGED, SystemEventType.USERNAME_CHANGED],
					},
					createdAt: { gte: yesterday, lt: date },
				},
			}),
			db.userSolve.count({
				where: {
					status: SolveStatus.MISSED,
					dailyProblem: { assignedDate: yesterday },
				},
			}),
			db.systemEventLog.count({
				where: {
					eventType: SystemEventType.SOLVE_FAILED,
					createdAt: { gte: yesterday, lt: date },
				},
			}),
		])
		return {
			totalSolves,
			activeUsers: solvers.length,
			newUsers,
			pausesUsed,
			handleChanges,
			misses,
			verificationFailures,
		}
	},

	// Activity within an arbitrary [from, to) window — powers the hourly digest.
	// Solves are windowed on `verifiedAt` (the moment verification succeeded);
	// misses on `updatedAt` (set by the midnight mark-missed batch, so hourly
	// misses read 0 outside the 00:00 tick — accurate, not a bug).
	getActivityStats: async (from: Date, to: Date) => {
		const [solvers, newUsers, pauses, misses, verificationFailures] = await Promise.all([
			db.userSolve.findMany({
				where: { status: SolveStatus.SOLVED, verifiedAt: { gte: from, lt: to } },
				select: { userId: true },
			}),
			db.user.count({ where: { createdAt: { gte: from, lt: to } } }),
			db.systemEventLog.count({
				where: {
					eventType: SystemEventType.PAUSE_USED,
					createdAt: { gte: from, lt: to },
				},
			}),
			db.userSolve.count({
				where: { status: SolveStatus.MISSED, updatedAt: { gte: from, lt: to } },
			}),
			db.systemEventLog.count({
				where: {
					eventType: SystemEventType.SOLVE_FAILED,
					createdAt: { gte: from, lt: to },
				},
			}),
		])
		return {
			solves: solvers.length,
			activeUsers: new Set(solvers.map((solve) => solve.userId)).size,
			newUsers,
			pauses,
			misses,
			verificationFailures,
		}
	},

	getDailyDigestRecipients: async (date: Date) => {
		const day = startOfUtcDay(date)

		const memberships = await db.groupMember.findMany({
			where: {
				joinedAt: { lt: day },
				status: GroupMemberStatus.ACTIVE,
				group: startedActiveGroupWhere,
			},
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

		await db.$transaction(async (tx) => {
			await tx.$executeRaw`SELECT pg_advisory_xact_lock(705414, 250)`

			const customSlugs = new Set(
				(
					await tx.problem.findMany({
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
						tx.problem.upsert({
							where: { slug: problem.slug },
							create: problem,
							update: problem,
						})
					)
				)
				seeded += results.length
			}

			await syncRoadmapCatalog(tx)
		})

		return { seeded, skipped }
	},

	// Single group's today. `groupId` omitted → the user's primary (oldest) group,
	// used internally by solve/pause when they already know the group.
	getTodayForUser: async (
		userId: string,
		groupId?: string
	): Promise<TodayProblemResponse> => {
		const [ctx, membership] = await Promise.all([
			getUserDashboardContext(userId),
			groupId ? findMembershipGroup(userId, groupId) : findPrimaryGroup(userId),
		])

		if (!membership) return noGroupToday(ctx)
		return buildTodayForGroup(userId, membership.group, ctx)
	},

	// One "today" entry per active group the user belongs to — the dashboard list.
	// Empty array => the user is in no groups (dashboard shows the join-a-group state).
	listTodayForUser: async (userId: string): Promise<TodayProblemResponse[]> => {
		const [ctx, memberships] = await Promise.all([
			getUserDashboardContext(userId),
			findActiveMembershipGroups(userId),
		])

		if (memberships.length === 0) return []
		return Promise.all(memberships.map((m) => buildTodayForGroup(userId, m.group, ctx)))
	},

	verifyAndMarkSolved: async (
		userId: string,
		groupId: string
	): Promise<MarkSolvedResult> => {
		const today = await problemsDao.getTodayForUser(userId, groupId)
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
		if (problem.isPremium) return { error: "PREMIUM_SKIPPED", today }

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
				}
			})

			return { error: "NOT_VERIFIED", today }
		}

		// Streak (and its streak-scoped bonuses) advance once per day. If the user
		// already solved another group today, this solve still earns base points,
		// first-in-group, and early-bird — but no streak advance, multiplier, or comeback.
		const streakAlreadyAdvancedToday = await hasSolvedAnyToday(
			userId,
			assignedDate,
			dailyProblemId
		)

		const isComeback =
			!streakAlreadyAdvancedToday && user.currentStreak === 0
				? await pointsDao.hasEverMissed(userId)
				: false

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
		const multiplierDelta = streakAlreadyAdvancedToday
			? 0
			: Math.floor(baseSolvePoints * multiplier) - baseSolvePoints

		const now = new Date()
		const submittedAt = verifyResult.submittedAt
		const isEarlyBird =
			submittedAt.getTime() - assignedDate.getTime() < EARLY_BIRD_WINDOW_MS
		const isNewStreak = !streakAlreadyAdvancedToday && user.currentStreak === 0
		const newStreak = streakAlreadyAdvancedToday
			? user.currentStreak
			: user.currentStreak + 1
		const newLongest = Math.max(newStreak, user.longestStreak)

		const { crossedProThreshold, newBadges } = await db.$transaction(async (tx) => {
			const current = await tx.userSolve.findUnique({
				where: { userId_dailyProblemId: { userId, dailyProblemId } },
				select: { status: true },
			})
			// A concurrent request already finished this solve — do nothing, award nothing.
			if (current?.status === SolveStatus.SOLVED) {
				const empty: BadgeType[] = []
				return { crossedProThreshold: false, newBadges: empty }
			}

			const upserted = await tx.userSolve.upsert({
				where: { userId_dailyProblemId: { userId, dailyProblemId } },
				create: {
					userId,
					dailyProblemId,
					status: SolveStatus.SOLVED,
					pointsEarned: baseSolvePoints,
					verifiedAt: now,
				},
				update: {
					status: SolveStatus.SOLVED,
					pointsEarned: baseSolvePoints,
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

			// Atomically claim first-solver: only ONE concurrent transaction can move
			// firstSolverId from null → this user. updateMany returns count 1 for the winner, 0 for losers.
			const claim = await tx.dailyProblem.updateMany({
				where: { id: dailyProblemId, firstSolverId: null },
				data: { firstSolverId: userId, firstSolveTime: now },
			})
			const isFirstInGroup = claim.count === 1

			if (isFirstInGroup) {
				const r2 = await pointsDao.applyPointsDelta(
					userId,
					FIRST_IN_GROUP_BONUS,
					PointReason.FIRST_IN_GROUP,
					opts
				)
				crossedPro ||= r2.crossedProThreshold
				await tx.userSolve.update({
					where: { id: upserted.id },
					data: { isFirstInGroup: true },
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

			// Only advance the streak on the first solve of the day. Later same-day
			// group solves leave currentStreak/longestStreak untouched.
			if (!streakAlreadyAdvancedToday) {
				await tx.user.update({
					where: { id: userId },
					data: {
						currentStreak: newStreak,
						longestStreak: newLongest,
						...(isNewStreak && { currentStreakStartedAt: now }),
					},
				})
			}
			await resolveActiveWarnings(
				tx,
				userId,
				today.group.id,
				WarningResolution.SOLVED_OR_PAUSED
			)

			const awarded = await badgesDao.evaluateAndAward(tx, userId, newStreak)

			return { crossedProThreshold: crossedPro, newBadges: awarded }
		})

		return {
			error: null,
			today: await problemsDao.getTodayForUser(userId, groupId),
			crossedProThreshold,
			newBadges,
			newStreak,
		}
	},

	// Per-day pause: takes today off across ALL of the user's groups at once for a
	// single flat penalty and one consumed monthly pause. The streak is user-level
	// and lenient, so a pause is only meaningful as a whole-day "I'm out".
	pauseToday: async (userId: string): Promise<PauseTodayResult> => {
		const todays = await problemsDao.listTodayForUser(userId)
		if (todays.length === 0) return { error: "NO_GROUP", todays }

		// If the user already solved any group today, the streak is already safe —
		// pausing would only cost points. Block it.
		const solvedAny = todays.some(
			(t) => t.state === "READY" && t.solve?.status === SolveStatus.SOLVED
		)
		if (solvedAny) return { error: "ALREADY_STARTED", todays }

		// Every started group whose problem is still open (no solve/pause/miss yet).
		const pausable = todays.filter(
			(t): t is Extract<TodayProblemResponse, { state: "READY" }> =>
				t.state === "READY" && t.solve == null
		)
		if (pausable.length === 0) return { error: "NOTHING_TO_PAUSE", todays }

		const { pausesRemaining } = await getUserDashboardContext(userId)
		if (pausesRemaining <= 0) return { error: "NO_PAUSES", todays }

		await db.$transaction(async (tx) => {
			let firstUpsertedId: string | undefined
			for (const t of pausable) {
				const upserted = await tx.userSolve.upsert({
					where: {
						userId_dailyProblemId: { userId, dailyProblemId: t.dailyProblem.id },
					},
					create: {
						userId,
						dailyProblemId: t.dailyProblem.id,
						status: SolveStatus.PAUSED,
					},
					update: { status: SolveStatus.PAUSED },
					select: { id: true },
				})
				if (!firstUpsertedId) firstUpsertedId = upserted.id
				await resolveActiveWarnings(
					tx,
					userId,
					t.group.id,
					WarningResolution.SOLVED_OR_PAUSED
				)
			}

			await tx.user.update({
				where: { id: userId },
				data: { pausesUsedThisMonth: { increment: 1 } },
			})
			await pointsDao.applyPointsDelta(userId, -PAUSE_PENALTY, PointReason.PAUSE, {
				tx,
				userSolveId: firstUpsertedId,
			})
		})

		return { error: null, todays: await problemsDao.listTodayForUser(userId) }
	},

	markMissedForDate: async (
		referenceDate: Date,
		opts: { evaluateWarnings?: boolean } = {}
	) => {
		const evaluateWarningsForDate = opts.evaluateWarnings ?? true
		const day = startOfUtcDay(referenceDate)
		// Before the cutover, only the primary group is evaluated (legacy behavior) so
		// the 14-day catch-up never retroactively marks non-primary groups MISSED for
		// days the pre-multi-group code ignored. On/after, every group counts.
		const multiGroup = day.getTime() >= MULTI_GROUP_CUTOVER_DATE.getTime()

		const memberships = await db.groupMember.findMany({
			where: {
				joinedAt: { lt: day },
				status: GroupMemberStatus.ACTIVE,
				group: startedActiveGroupWhere,
			},
			orderBy: [{ userId: "asc" }, { joinedAt: "asc" }],
			select: {
				id: true,
				groupId: true,
				userId: true,
				role: true,
				group: { select: { type: true } },
			},
		})

		const primaryByUser = new Map<string, (typeof memberships)[number]>()
		for (const m of memberships) {
			if (!primaryByUser.has(m.userId)) primaryByUser.set(m.userId, m)
		}
		if (primaryByUser.size === 0) return { missed: 0, warned: 0, removed: 0 }

		const primaryMemberships = Array.from(primaryByUser.values())
		const consideredMemberships = multiGroup ? memberships : primaryMemberships

		const runWarnings = async () =>
			evaluateWarningsForDate
				? await evaluateInactivityWarnings(primaryMemberships, day)
				: { warned: 0, removed: 0 }

		const groupIds = Array.from(new Set(consideredMemberships.map((m) => m.groupId)))
		const dailyProblems = await db.dailyProblem.findMany({
			where: { groupId: { in: groupIds }, assignedDate: day },
			select: { id: true, groupId: true },
		})
		const dailyByGroup = new Map(dailyProblems.map((dp) => [dp.groupId, dp.id]))

		const candidates: { userId: string; groupId: string; dailyProblemId: string }[] = []
		for (const membership of consideredMemberships) {
			const dpId = dailyByGroup.get(membership.groupId)
			if (dpId) {
				candidates.push({
					userId: membership.userId,
					groupId: membership.groupId,
					dailyProblemId: dpId,
				})
			}
		}
		if (candidates.length === 0) return { missed: 0, ...(await runWarnings()) }

		const userIds = Array.from(new Set(candidates.map((c) => c.userId)))
		const dailyProblemIds = Array.from(new Set(candidates.map((c) => c.dailyProblemId)))

		const [existingSolves, usersWithStreak] = await Promise.all([
			db.userSolve.findMany({
				where: { userId: { in: userIds }, dailyProblemId: { in: dailyProblemIds } },
				select: { userId: true, dailyProblemId: true, status: true },
			}),
			db.user.findMany({
				where: { id: { in: userIds } },
				select: { id: true, currentStreakStartedAt: true },
			}),
		])

		const existingKey = new Set(
			existingSolves.map((s) => `${s.userId}:${s.dailyProblemId}`)
		)
		// A user is "engaged" today if they have any non-MISSED row across their
		// considered groups (SOLVED, PAUSED, or an in-flight/failed verification).
		// Engagement keeps the lenient user-level streak alive — a full no-show breaks it.
		const engagedTodayByUser = new Set(
			existingSolves.filter((s) => s.status !== SolveStatus.MISSED).map((s) => s.userId)
		)
		const streakStartByUser = new Map(
			usersWithStreak.map((u) => [u.id, u.currentStreakStartedAt])
		)

		const toMiss = candidates.filter(
			(c) => !existingKey.has(`${c.userId}:${c.dailyProblemId}`)
		)
		if (toMiss.length === 0) return { missed: 0, ...(await runWarnings()) }

		let missed = 0
		const missedUserIds = new Set<string>()
		for (const { userId, groupId, dailyProblemId } of toMiss) {
			try {
				await db.$transaction(async (tx) => {
					const solve = await tx.userSolve.create({
						data: {
							userId,
							dailyProblemId,
							status: SolveStatus.MISSED,
							pointsEarned: 0,
						},
						select: { id: true },
					})

					if (multiGroup) {
						// −3 per missed group; the streak is broken once per user below.
						await pointsDao.applyMissPoints(tx, userId, {
							userSolveId: solve.id,
							groupId,
						})
					} else {
						await pointsDao.applyMissPenalty(tx, userId, {
							userSolveId: solve.id,
							streakStartedAt: streakStartByUser.get(userId) ?? null,
						})
					}
				})
				missed++
				missedUserIds.add(userId)
			} catch (err) {
				if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
					continue
				}
				throw err
			}
		}

		// Multi-group: break each user's streak at most once, and only on a full
		// no-show (they neither solved nor paused any group today). Legacy already
		// reset the streak inside applyMissPenalty.
		if (multiGroup) {
			for (const userId of missedUserIds) {
				if (engagedTodayByUser.has(userId)) continue
				await db.$transaction((tx) =>
					pointsDao.breakUserStreak(tx, userId, streakStartByUser.get(userId) ?? null)
				)
			}
		}

		return { missed, ...(await runWarnings()) }
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
		const [roadmapProblems, solves] = await Promise.all([
			db.roadmapProblem.findMany({
				where: { roadmap: { key: roadmap } },
				orderBy: { position: "asc" },
				select: {
					position: true,
					topic: true,
					problem: { select: problemSelect },
				},
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

		return roadmapProblems.map((roadmapProblem) => ({
			...roadmapProblem.problem,
			roadmapIndex: roadmapProblem.position,
			topic: roadmapProblem.topic ?? roadmapProblem.problem.topic,
			status: statusByProblemId.get(roadmapProblem.problem.id) ?? "UNSOLVED",
		}))
	},
}
