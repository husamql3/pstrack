/**
 * Integration tests for the core daily loop.
 *
 * Everything hits the real test DB (see src/test/db.ts for the client).
 * The ONLY thing mocked is the network call to LeetCode's GraphQL API
 * (the `fetch` inside `verifyLeetCodeSubmission`), because we cannot
 * make real outbound calls in CI.
 *
 * resetDb() is called in beforeEach via src/test/setup.ts.
 */

// @ts-nocheck — suppress strict-null / implicit-any for vi.spyOn globals
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { PointReason, SolveStatus } from "@/generated/prisma/enums"
import { auditCachedTotals } from "@/server/points/points.reconciliation"
import {
	FIRST_IN_GROUP_BONUS,
	MISSED_PENALTY,
	SOLVE_POINTS,
} from "@/server/points/points.type"
import { problemsDao } from "@/server/problems/problems.dao"
import {
	addMember,
	createDailyProblem,
	createGroup,
	createProblem,
	createUser,
	testDb,
} from "@/test/db"

// ---------------------------------------------------------------------------
// Helper: mock the LeetCode fetch globally
// ---------------------------------------------------------------------------

const mockFetch = vi.fn()

beforeEach(() => {
	vi.stubGlobal("fetch", mockFetch)
})

afterEach(() => {
	vi.unstubAllGlobals()
})

/**
 * Build a fetch mock that returns a successful LeetCode submission
 * for the given slug, submitted `msSinceAssigned` ms after assignedDate.
 */
const mockLeetCodeMatch = (slug: string, submittedAtMs: number) => {
	mockFetch.mockResolvedValue({
		json: async () => ({
			data: {
				recentAcSubmissionList: [
					{
						titleSlug: slug,
						timestamp: String(Math.floor(submittedAtMs / 1000)),
					},
				],
			},
		}),
	})
}

const _mockLeetCodeNoMatch = () => {
	mockFetch.mockResolvedValue({
		json: async () => ({ data: { recentAcSubmissionList: [] } }),
	})
}

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

/**
 * Seed: active+started group, one member with a leetcodeHandle, one
 * DailyProblem for `assignedDate`, with a RoadmapCatalog + RoadmapProblem
 * so withRoadmapMetadata resolves cleanly.
 */
const seedHappyPath = async (assignedDate: Date) => {
	const user = await createUser({ leetcodeHandle: "testhandle" })
	const group = await createGroup({ roadmap: "NC250", isActive: true, isStarted: true })
	await addMember(group.id, user.id)

	const problem = await createProblem({
		slug: "two-sum",
		difficulty: "MEDIUM",
		neetcode250: true,
	})

	// RoadmapCatalog is created by createGroup → createRoadmapCatalog("NC250").
	// Add a RoadmapProblem so withRoadmapMetadata finds it.
	const catalog = await testDb.roadmapCatalog.findUniqueOrThrow({
		where: { key: "NC250" },
	})
	await testDb.roadmapProblem.create({
		data: {
			roadmapId: catalog.id,
			problemId: problem.id,
			position: 1,
			topic: problem.topic,
		},
	})

	const dailyProblem = await createDailyProblem({
		groupId: group.id,
		problemId: problem.id,
		assignedDate,
	})

	return { user, group, problem, dailyProblem }
}

const addLedgerEntryForDailyLoop = (userId: string, delta: number, createdAt: Date) =>
	testDb.pointsHistory.create({
		data: {
			userId,
			delta,
			reason: PointReason.ADMIN_ADJUSTMENT,
			createdAt,
		},
	})

// ---------------------------------------------------------------------------
// Test: happy-path solve
// ---------------------------------------------------------------------------

describe("verifyAndMarkSolved — happy path", () => {
	it("creates a SOLVED UserSolve, DAILY_SOLVE + FIRST_IN_GROUP ledger rows, updates totalPoints and streak", async () => {
		const today = new Date(
			Date.UTC(
				new Date().getUTCFullYear(),
				new Date().getUTCMonth(),
				new Date().getUTCDate()
			)
		)
		const { user, problem } = await seedHappyPath(today)

		// Mock: submission found, submitted 1 hour after midnight (within early-bird window)
		const submittedAtMs = today.getTime() + 1 * 60 * 60 * 1000
		mockLeetCodeMatch(problem.slug, submittedAtMs)

		const result = await problemsDao.verifyAndMarkSolved(user.id)

		// --- top-level result shape
		expect(result.error).toBeNull()
		expect(result.newStreak).toBe(1)

		// --- UserSolve row
		const solves = await testDb.userSolve.findMany({ where: { userId: user.id } })
		expect(solves).toHaveLength(1)
		const solve = solves[0]
		expect(solve.status).toBe(SolveStatus.SOLVED)
		expect(solve.isFirstInGroup).toBe(true)

		// --- PointsHistory rows: DAILY_SOLVE, FIRST_IN_GROUP, EARLY_BIRD (submission < 12h)
		const ledger = await testDb.pointsHistory.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: "asc" },
		})

		const reasons = ledger.map((r) => r.reason)
		expect(reasons).toContain(PointReason.DAILY_SOLVE)
		expect(reasons).toContain(PointReason.FIRST_IN_GROUP)
		expect(reasons).toContain(PointReason.EARLY_BIRD)

		// No duplicates — each (userSolveId, reason) is unique in the ledger
		const keys = ledger.map((r) => `${r.userSolveId}:${r.reason}`)
		expect(new Set(keys).size).toBe(keys.length)

		// --- Points amounts
		const dailySolveDelta = ledger.find(
			(r) => r.reason === PointReason.DAILY_SOLVE
		)?.delta
		expect(dailySolveDelta).toBe(SOLVE_POINTS.MEDIUM) // MEDIUM = 10

		const firstInGroupDelta = ledger.find(
			(r) => r.reason === PointReason.FIRST_IN_GROUP
		)?.delta
		expect(firstInGroupDelta).toBe(FIRST_IN_GROUP_BONUS) // +10

		// --- User denormalized cache
		const updatedUser = await testDb.user.findUniqueOrThrow({ where: { id: user.id } })
		const expectedTotal = ledger.reduce((sum, r) => sum + r.delta, 0)
		expect(updatedUser.totalPoints).toBe(expectedTotal)
		expect(updatedUser.currentStreak).toBe(1)
	})
})

// ---------------------------------------------------------------------------
// Test: no-duplicate guard
// ---------------------------------------------------------------------------

describe("verifyAndMarkSolved — idempotency", () => {
	it("concurrent solve requests produce one base award and each bonus at most once", async () => {
		const today = new Date(
			Date.UTC(
				new Date().getUTCFullYear(),
				new Date().getUTCMonth(),
				new Date().getUTCDate()
			)
		)
		const { user, problem } = await seedHappyPath(today)

		const submittedAtMs = today.getTime() + 2 * 60 * 60 * 1000
		mockLeetCodeMatch(problem.slug, submittedAtMs)

		await Promise.all(
			Array.from({ length: 8 }, () => problemsDao.verifyAndMarkSolved(user.id))
		)

		const dailySolveRows = await testDb.pointsHistory.findMany({
			where: { userId: user.id, reason: PointReason.DAILY_SOLVE },
		})
		expect(dailySolveRows).toHaveLength(1)

		const firstRows = await testDb.pointsHistory.findMany({
			where: { userId: user.id, reason: PointReason.FIRST_IN_GROUP },
		})
		expect(firstRows).toHaveLength(1)

		const earlyBirdRows = await testDb.pointsHistory.findMany({
			where: { userId: user.id, reason: PointReason.EARLY_BIRD },
		})
		expect(earlyBirdRows).toHaveLength(1)
		await expect(auditCachedTotals()).resolves.toMatchObject({
			mismatchedUsers: 0,
			absoluteDrift: 0,
		})
	})
})

describe("points invariant across daily outcomes", () => {
	it("keeps multiplier and first-solver bonuses aligned with the cached total", async () => {
		const today = new Date(
			Date.UTC(
				new Date().getUTCFullYear(),
				new Date().getUTCMonth(),
				new Date().getUTCDate()
			)
		)
		const { user, problem } = await seedHappyPath(today)
		const streakStartedAt = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
		await testDb.user.update({
			where: { id: user.id },
			data: {
				totalPoints: 100,
				currentStreak: 7,
				longestStreak: 7,
				currentStreakStartedAt: streakStartedAt,
			},
		})
		await addLedgerEntryForDailyLoop(user.id, 100, streakStartedAt)
		mockLeetCodeMatch(problem.slug, today.getTime() + 60 * 60 * 1000)

		await problemsDao.verifyAndMarkSolved(user.id)

		await expect(
			testDb.pointsHistory.findFirstOrThrow({
				where: { userId: user.id, reason: PointReason.STREAK_MULTIPLIER_BONUS },
			})
		).resolves.toMatchObject({ delta: 2 })
		await expect(auditCachedTotals()).resolves.toMatchObject({
			mismatchedUsers: 0,
			absoluteDrift: 0,
		})
	})

	it("keeps a pause penalty aligned with the cached total", async () => {
		const today = new Date(
			Date.UTC(
				new Date().getUTCFullYear(),
				new Date().getUTCMonth(),
				new Date().getUTCDate()
			)
		)
		const { user } = await seedHappyPath(today)
		await testDb.user.update({ where: { id: user.id }, data: { totalPoints: 20 } })
		await addLedgerEntryForDailyLoop(user.id, 20, new Date(today.getTime() - 1_000))

		await problemsDao.pauseToday(user.id)

		await expect(
			testDb.pointsHistory.findFirstOrThrow({
				where: { userId: user.id, reason: PointReason.PAUSE },
			})
		).resolves.toMatchObject({ delta: -5 })
		await expect(auditCachedTotals()).resolves.toMatchObject({
			mismatchedUsers: 0,
			absoluteDrift: 0,
		})
	})

	it("retries cleanly after an external verification failure", async () => {
		const today = new Date(
			Date.UTC(
				new Date().getUTCFullYear(),
				new Date().getUTCMonth(),
				new Date().getUTCDate()
			)
		)
		const { user, problem } = await seedHappyPath(today)
		mockFetch.mockRejectedValueOnce(new Error("temporary LeetCode outage"))

		await expect(problemsDao.verifyAndMarkSolved(user.id)).resolves.toMatchObject({
			error: "NOT_VERIFIED",
		})
		await expect(testDb.userSolve.count({ where: { userId: user.id } })).resolves.toBe(0)
		await expect(
			testDb.pointsHistory.findMany({ where: { userId: user.id } })
		).resolves.toEqual([
			expect.objectContaining({
				reason: PointReason.VERIFICATION_FAILURE_GRACE,
				delta: 0,
			}),
		])

		mockLeetCodeMatch(problem.slug, today.getTime() + 60 * 60 * 1000)
		await problemsDao.verifyAndMarkSolved(user.id)

		await expect(auditCachedTotals()).resolves.toMatchObject({
			mismatchedUsers: 0,
			absoluteDrift: 0,
		})
	})
})

// ---------------------------------------------------------------------------
// Test: mark-missed
// ---------------------------------------------------------------------------

describe("markMissedForDate", () => {
	it("creates a MISSED UserSolve, writes a MISSED_DAY ledger row of -MISSED_PENALTY, and resets streak", async () => {
		const yesterday = new Date(
			Date.UTC(
				new Date().getUTCFullYear(),
				new Date().getUTCMonth(),
				new Date().getUTCDate() - 1
			)
		)

		// Seed a member who joined before yesterday (joinedAt default is now,
		// so we override it to be safely before the reference date)
		const user = await createUser({ leetcodeHandle: "missedhandle", currentStreak: 3 })
		const group = await createGroup({ roadmap: "NC250", isActive: true, isStarted: true })

		// Override joinedAt to be before yesterday so markMissedForDate picks it up
		const member = await addMember(group.id, user.id)
		await testDb.groupMember.update({
			where: { id: member.id },
			data: { joinedAt: new Date(yesterday.getTime() - 2 * 24 * 60 * 60 * 1000) },
		})

		// Give user a non-zero streak so we can confirm it resets
		await testDb.user.update({
			where: { id: user.id },
			data: {
				currentStreak: 3,
				currentStreakStartedAt: new Date(yesterday.getTime() - 2 * 24 * 60 * 60 * 1000),
			},
		})

		const problem = await createProblem({
			slug: "missed-problem",
			difficulty: "EASY",
			neetcode250: true,
		})
		const catalog = await testDb.roadmapCatalog.findUniqueOrThrow({
			where: { key: "NC250" },
		})
		await testDb.roadmapProblem.upsert({
			where: { roadmapId_problemId: { roadmapId: catalog.id, problemId: problem.id } },
			create: {
				roadmapId: catalog.id,
				problemId: problem.id,
				position: 2,
				topic: problem.topic,
			},
			update: {},
		})

		await createDailyProblem({
			groupId: group.id,
			problemId: problem.id,
			assignedDate: yesterday,
		})

		// Act
		const result = await problemsDao.markMissedForDate(yesterday, {
			evaluateWarnings: false,
		})

		// --- outcome shape
		expect(result.missed).toBe(1)

		// --- UserSolve is MISSED
		const solves = await testDb.userSolve.findMany({ where: { userId: user.id } })
		expect(solves).toHaveLength(1)
		expect(solves[0].status).toBe(SolveStatus.MISSED)

		// --- PointsHistory contains a MISSED_DAY entry with -MISSED_PENALTY
		const ledger = await testDb.pointsHistory.findMany({ where: { userId: user.id } })
		const missedRow = ledger.find((r) => r.reason === PointReason.MISSED_DAY)
		expect(missedRow).toBeDefined()
		expect(missedRow?.delta).toBe(-MISSED_PENALTY)

		// --- Streak reset
		const updatedUser = await testDb.user.findUniqueOrThrow({ where: { id: user.id } })
		expect(updatedUser.currentStreak).toBe(0)
		expect(updatedUser.currentStreakStartedAt).toBeNull()
	})

	it("applies one penalty and one bonus clawback under concurrent miss sweeps", async () => {
		const yesterday = new Date(
			Date.UTC(
				new Date().getUTCFullYear(),
				new Date().getUTCMonth(),
				new Date().getUTCDate() - 1
			)
		)
		const streakStartedAt = new Date(yesterday.getTime() - 7 * 24 * 60 * 60 * 1000)
		const user = await createUser({
			leetcodeHandle: "concurrent-miss",
			currentStreak: 7,
			currentStreakStartedAt: streakStartedAt,
			totalPoints: 50,
		})
		const group = await createGroup({ roadmap: "NC250", isActive: true, isStarted: true })
		const member = await addMember(group.id, user.id)
		await testDb.groupMember.update({
			where: { id: member.id },
			data: { joinedAt: new Date(streakStartedAt.getTime() - 24 * 60 * 60 * 1000) },
		})
		const problem = await createProblem({ slug: "concurrent-missed-problem" })
		await createDailyProblem({
			groupId: group.id,
			problemId: problem.id,
			assignedDate: yesterday,
		})
		await testDb.pointsHistory.createMany({
			data: [
				{
					userId: user.id,
					delta: 38,
					reason: PointReason.ADMIN_ADJUSTMENT,
					createdAt: streakStartedAt,
				},
				{
					userId: user.id,
					delta: 10,
					reason: PointReason.FIRST_IN_GROUP,
					createdAt: new Date(streakStartedAt.getTime() + 1_000),
				},
				{
					userId: user.id,
					delta: 2,
					reason: PointReason.STREAK_MULTIPLIER_BONUS,
					createdAt: new Date(streakStartedAt.getTime() + 2_000),
				},
			],
		})

		const results = await Promise.all(
			Array.from({ length: 8 }, () =>
				problemsDao.markMissedForDate(yesterday, { evaluateWarnings: false })
			)
		)

		expect(results.reduce((sum, result) => sum + result.missed, 0)).toBe(1)
		await expect(
			testDb.userSolve.count({ where: { userId: user.id, status: SolveStatus.MISSED } })
		).resolves.toBe(1)
		await expect(
			testDb.pointsHistory.count({
				where: { userId: user.id, reason: PointReason.CLAWBACK },
			})
		).resolves.toBe(1)
		await expect(
			testDb.pointsHistory.count({
				where: { userId: user.id, reason: PointReason.MISSED_DAY },
			})
		).resolves.toBe(1)
		await expect(
			testDb.user.findUniqueOrThrow({ where: { id: user.id } })
		).resolves.toMatchObject({ totalPoints: 35, currentStreak: 0 })
		await expect(auditCachedTotals()).resolves.toMatchObject({
			mismatchedUsers: 0,
			absoluteDrift: 0,
		})
	})
})
