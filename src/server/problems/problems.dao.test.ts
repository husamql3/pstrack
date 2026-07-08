// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const tx = {
	group: {
		findUniqueOrThrow: vi.fn(),
		update: vi.fn(),
	},
	groupMember: {
		findUnique: vi.fn(),
		update: vi.fn(),
	},
	groupMemberWarning: {
		update: vi.fn(),
		updateMany: vi.fn(),
	},
	user: {
		update: vi.fn(),
	},
	dailyProblem: {
		create: vi.fn(),
		findFirst: vi.fn(),
		update: vi.fn(),
		updateMany: vi.fn(),
	},
	problem: {
		findFirst: vi.fn(),
	},
	roadmapProblem: {
		findFirst: vi.fn(),
	},
	userSolve: {
		create: vi.fn(),
		upsert: vi.fn(),
		findUnique: vi.fn(),
		update: vi.fn(),
	},
}

vi.mock("@/server/lib/db", () => ({
	db: {
		$transaction: vi.fn(async (callback) => callback(tx)),
		dailyProblem: { findMany: vi.fn() },
		group: { findUniqueOrThrow: vi.fn() },
		groupMember: { findMany: vi.fn(), findFirst: vi.fn() },
		groupMemberWarning: { create: vi.fn(), findFirst: vi.fn() },
		problem: { count: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
		user: { findMany: vi.fn(), findUniqueOrThrow: vi.fn() },
		userSolve: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
	},
}))

vi.mock("@/server/points/points.dao", () => ({
	pointsDao: {
		applyMissPenalty: vi.fn(),
		applyPointsDelta: vi.fn(),
		hasEverMissed: vi.fn(),
	},
}))

vi.mock("@/server/badges/badges.dao", () => ({
	badgesDao: { evaluateAndAward: vi.fn() },
}))

vi.mock("@/server/groups/groups.notifications", () => ({
	groupNotifications: {
		inactivityWarning: vi.fn(),
		memberRemoved: vi.fn(),
	},
}))

import {
	BadgeType,
	Difficulty,
	GroupType,
	MemberRole,
	PointReason,
	SolveStatus,
} from "@/generated/prisma/enums"
import { badgesDao } from "@/server/badges/badges.dao"
import { groupNotifications } from "@/server/groups/groups.notifications"
import { db } from "@/server/lib/db"
import { pointsDao } from "@/server/points/points.dao"
import { problemsDao } from "./problems.dao"

const readyToday = {
	state: "READY",
	group: { id: "group-1", slug: "alpha", roadmap: "NC250" },
	groupRoadmap: "NC250",
	dailyProblem: {
		id: "daily-1",
		assignedDate: new Date("2026-06-16T00:00:00.000Z"),
		firstSolveTime: null,
		group: { id: "group-1", slug: "alpha", roadmap: "NC250" },
		problem: {
			id: "problem-1",
			slug: "two-sum",
			title: "Two Sum",
			difficulty: Difficulty.EASY,
			topic: "Arrays",
			roadmapIndex: 1,
			leetcodeId: 1,
			isPremium: false,
			neetcode250: true,
			neetcode150: true,
			blind75: true,
		},
	},
	solve: null,
	pausesRemaining: 1,
	pausesTotal: 2,
	groupRank: 1,
	groupSize: 3,
	groupSolvedCount: 0,
	userStats: { currentStreak: 4, longestStreak: 8, totalPoints: 120 },
}

describe("problemsDao", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
	})

	describe("assignNextProblemTx", () => {
		it("skips premium roadmap entries and advances to the assigned problem index", async () => {
			tx.group.findUniqueOrThrow.mockResolvedValue({
				roadmap: "NC250",
				roadmapIndex: 149,
			})
			tx.roadmapProblem.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
				problemId: "problem-250",
				position: 150,
				topic: "Graphs",
			})
			tx.dailyProblem.create.mockResolvedValue({
				id: "daily-250",
				problem: { roadmapIndex: 250, topic: "Advanced Graphs" },
			})

			const result = await problemsDao.assignNextProblemTx(
				tx,
				"group-1",
				new Date("2026-07-07T00:00:00.000Z")
			)

			expect(result).toEqual({
				id: "daily-250",
				problem: { roadmapIndex: 150, topic: "Graphs" },
			})
			expect(tx.roadmapProblem.findFirst).toHaveBeenNthCalledWith(1, {
				where: {
					roadmap: { key: "NC250" },
					problem: { dailyProblems: { some: { groupId: "group-1" } } },
				},
				orderBy: { position: "desc" },
				select: { position: true },
			})
			expect(tx.roadmapProblem.findFirst).toHaveBeenNthCalledWith(2, {
				where: {
					roadmap: { key: "NC250" },
					position: { gt: 149 },
					problem: { isPremium: false },
				},
				orderBy: { position: "asc" },
				select: { problemId: true, position: true, topic: true },
			})
			expect(tx.dailyProblem.create).toHaveBeenCalledWith({
				data: {
					groupId: "group-1",
					assignedDate: new Date("2026-07-07T00:00:00.000Z"),
					problemId: "problem-250",
				},
				select: expect.any(Object),
			})
			expect(tx.group.update).toHaveBeenCalledWith({
				where: { id: "group-1" },
				data: { roadmapIndex: 150 },
			})
		})

		it("uses the highest already-assigned problem when the group cursor is stale", async () => {
			tx.group.findUniqueOrThrow.mockResolvedValue({
				roadmap: "NC150",
				roadmapIndex: 13,
			})
			tx.roadmapProblem.findFirst
				.mockResolvedValueOnce({ position: 17 })
				.mockResolvedValueOnce({
					problemId: "problem-23",
					position: 23,
					topic: "Trees",
				})
			tx.dailyProblem.create.mockResolvedValue({
				id: "daily-23",
				problem: { roadmapIndex: 23, topic: "Trees" },
			})

			const result = await problemsDao.assignNextProblemTx(
				tx,
				"group-1",
				new Date("2026-07-07T00:00:00.000Z")
			)

			expect(result).toEqual({
				id: "daily-23",
				problem: { roadmapIndex: 23, topic: "Trees" },
			})
			expect(tx.roadmapProblem.findFirst).toHaveBeenNthCalledWith(1, {
				where: {
					roadmap: { key: "NC150" },
					problem: { dailyProblems: { some: { groupId: "group-1" } } },
				},
				orderBy: { position: "desc" },
				select: { position: true },
			})
			expect(tx.roadmapProblem.findFirst).toHaveBeenNthCalledWith(2, {
				where: {
					roadmap: { key: "NC150" },
					position: { gt: 17 },
					problem: { isPremium: false },
				},
				orderBy: { position: "asc" },
				select: { problemId: true, position: true, topic: true },
			})
			expect(tx.group.update).toHaveBeenCalledWith({
				where: { id: "group-1" },
				data: { roadmapIndex: 23 },
			})
		})
	})

	describe("verifyAndMarkSolved", () => {
		it("awards solve points, first-in-group (atomic claim), early-bird, updates streaks, and evaluates badges when LeetCode verifies", async () => {
			// Changed from old test: removed db.userSolve.count mock (no longer used);
			// isFirstInGroup now comes from atomic tx.dailyProblem.updateMany (count=1 = winner);
			// isFirstInGroup no longer in upsert payload — set via separate tx.userSolve.update;
			// tx.dailyProblem.update replaced with tx.dailyProblem.updateMany for atomic claim;
			// tx.userSolve.findUnique returns null (not already solved) to pass the re-check.
			const updatedToday = {
				...readyToday,
				solve: { id: "solve-1", status: SolveStatus.SOLVED, pointsEarned: 5 },
				groupSolvedCount: 1,
				userStats: { currentStreak: 5, longestStreak: 8, totalPoints: 137 },
			}
			vi.spyOn(problemsDao, "getTodayForUser")
				.mockResolvedValueOnce(readyToday)
				.mockResolvedValueOnce(updatedToday)
			db.user.findUniqueOrThrow.mockResolvedValue({
				leetcodeHandle: "alice",
				currentStreak: 4,
				longestStreak: 8,
				currentStreakStartedAt: new Date("2026-06-12T00:00:00.000Z"),
				verificationFailuresThisMonth: 0,
			})
			vi.stubGlobal(
				"fetch",
				vi.fn(async () => ({
					json: async () => ({
						data: {
							recentAcSubmissionList: [
								{
									titleSlug: "two-sum",
									timestamp: String(
										new Date("2026-06-16T02:00:00.000Z").getTime() / 1000
									),
								},
							],
						},
					}),
				}))
			)
			pointsDao.hasEverMissed.mockResolvedValue(false)
			tx.userSolve.findUnique.mockResolvedValue(null) // not already solved
			tx.userSolve.upsert.mockResolvedValue({ id: "solve-1" })
			tx.dailyProblem.updateMany.mockResolvedValue({ count: 1 }) // winner of first-solver claim
			pointsDao.applyPointsDelta.mockResolvedValue({
				newTotal: 137,
				crossedProThreshold: false,
			})
			tx.groupMember.findUnique.mockResolvedValue({ id: "member-1" })
			badgesDao.evaluateAndAward.mockResolvedValue([BadgeType.SOLVED_1])

			const result = await problemsDao.verifyAndMarkSolved("user-1")

			expect(result).toEqual({
				error: null,
				today: updatedToday,
				crossedProThreshold: false,
				newBadges: [BadgeType.SOLVED_1],
				newStreak: 5,
			})
			expect(fetch).toHaveBeenCalledWith(
				"https://leetcode.com/graphql",
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
				})
			)
			// upsert no longer includes isFirstInGroup — it is set separately after the atomic claim
			expect(tx.userSolve.upsert).toHaveBeenCalledWith({
				where: { userId_dailyProblemId: { userId: "user-1", dailyProblemId: "daily-1" } },
				create: {
					userId: "user-1",
					dailyProblemId: "daily-1",
					status: SolveStatus.SOLVED,
					pointsEarned: 5,
					verifiedAt: expect.any(Date),
				},
				update: {
					status: SolveStatus.SOLVED,
					pointsEarned: 5,
					verifiedAt: expect.any(Date),
				},
				select: { id: true },
			})
			expect(pointsDao.applyPointsDelta).toHaveBeenNthCalledWith(
				1,
				"user-1",
				5,
				PointReason.DAILY_SOLVE,
				{ tx, userSolveId: "solve-1" }
			)
			// atomic claim won (count=1), so FIRST_IN_GROUP is awarded
			expect(tx.dailyProblem.updateMany).toHaveBeenCalledWith({
				where: { id: "daily-1", firstSolverId: null },
				data: { firstSolverId: "user-1", firstSolveTime: expect.any(Date) },
			})
			expect(pointsDao.applyPointsDelta).toHaveBeenNthCalledWith(
				2,
				"user-1",
				10,
				PointReason.FIRST_IN_GROUP,
				{ tx, userSolveId: "solve-1" }
			)
			expect(pointsDao.applyPointsDelta).toHaveBeenNthCalledWith(
				3,
				"user-1",
				2,
				PointReason.EARLY_BIRD,
				{ tx, userSolveId: "solve-1" }
			)
			expect(tx.user.update).toHaveBeenCalledWith({
				where: { id: "user-1" },
				data: {
					currentStreak: 5,
					longestStreak: 8,
				},
			})
			expect(badgesDao.evaluateAndAward).toHaveBeenCalledWith(tx, "user-1", 5)
		})

		it("rejects premium skipped problems before LeetCode verification", async () => {
			const premiumToday = {
				...readyToday,
				dailyProblem: {
					...readyToday.dailyProblem,
					problem: {
						...readyToday.dailyProblem.problem,
						isPremium: true,
					},
				},
			}
			vi.spyOn(problemsDao, "getTodayForUser").mockResolvedValue(premiumToday)
			vi.stubGlobal("fetch", vi.fn())

			const result = await problemsDao.verifyAndMarkSolved("user-1")

			expect(result).toEqual({ error: "PREMIUM_SKIPPED", today: premiumToday })
			expect(fetch).not.toHaveBeenCalled()
			expect(db.user.findUniqueOrThrow).not.toHaveBeenCalled()
			expect(tx.userSolve.upsert).not.toHaveBeenCalled()
			expect(pointsDao.applyPointsDelta).not.toHaveBeenCalled()
		})

		it("uses the first monthly verification failure as grace without marking the solve missed", async () => {
			vi.spyOn(problemsDao, "getTodayForUser").mockResolvedValue(readyToday)
			db.user.findUniqueOrThrow.mockResolvedValue({
				leetcodeHandle: "alice",
				currentStreak: 4,
				longestStreak: 8,
				currentStreakStartedAt: new Date("2026-06-12T00:00:00.000Z"),
				verificationFailuresThisMonth: 0,
			})
			vi.stubGlobal(
				"fetch",
				vi.fn(async () => ({
					json: async () => ({
						data: { recentAcSubmissionList: [] },
					}),
				}))
			)

			const result = await problemsDao.verifyAndMarkSolved("user-1")

			expect(result).toEqual({ error: "NOT_VERIFIED", today: readyToday })
			expect(tx.user.update).toHaveBeenCalledWith({
				where: { id: "user-1" },
				data: { verificationFailuresThisMonth: 1 },
			})
			expect(pointsDao.applyPointsDelta).toHaveBeenCalledWith(
				"user-1",
				0,
				PointReason.VERIFICATION_FAILURE_GRACE,
				{ tx }
			)
			expect(tx.userSolve.upsert).not.toHaveBeenCalled()
			expect(pointsDao.applyMissPenalty).not.toHaveBeenCalled()
		})

		it("tracks repeated verification failures without marking the solve missed", async () => {
			vi.spyOn(problemsDao, "getTodayForUser").mockResolvedValue(readyToday)
			db.user.findUniqueOrThrow.mockResolvedValue({
				leetcodeHandle: "alice",
				currentStreak: 4,
				longestStreak: 8,
				currentStreakStartedAt: new Date("2026-06-12T00:00:00.000Z"),
				verificationFailuresThisMonth: 1,
			})
			vi.stubGlobal(
				"fetch",
				vi.fn(async () => ({
					json: async () => ({
						data: { recentAcSubmissionList: [] },
					}),
				}))
			)

			const result = await problemsDao.verifyAndMarkSolved("user-1")

			expect(result).toEqual({ error: "NOT_VERIFIED", today: readyToday })
			expect(tx.user.update).toHaveBeenCalledWith({
				where: { id: "user-1" },
				data: { verificationFailuresThisMonth: 2 },
			})
			expect(pointsDao.applyPointsDelta).not.toHaveBeenCalled()
			expect(tx.userSolve.upsert).not.toHaveBeenCalled()
			expect(pointsDao.applyMissPenalty).not.toHaveBeenCalled()
		})

		it("first-solver loser (atomic claim count=0) does not award FIRST_IN_GROUP", async () => {
			const updatedToday = {
				...readyToday,
				solve: { id: "solve-1", status: SolveStatus.SOLVED, pointsEarned: 5 },
				groupSolvedCount: 1,
				userStats: { currentStreak: 5, longestStreak: 8, totalPoints: 127 },
			}
			vi.spyOn(problemsDao, "getTodayForUser")
				.mockResolvedValueOnce(readyToday)
				.mockResolvedValueOnce(updatedToday)
			db.user.findUniqueOrThrow.mockResolvedValue({
				leetcodeHandle: "alice",
				currentStreak: 4,
				longestStreak: 8,
				currentStreakStartedAt: new Date("2026-06-12T00:00:00.000Z"),
				verificationFailuresThisMonth: 0,
			})
			vi.stubGlobal(
				"fetch",
				vi.fn(async () => ({
					json: async () => ({
						data: {
							recentAcSubmissionList: [
								{
									titleSlug: "two-sum",
									timestamp: String(
										new Date("2026-06-16T02:00:00.000Z").getTime() / 1000
									),
								},
							],
						},
					}),
				}))
			)
			pointsDao.hasEverMissed.mockResolvedValue(false)
			tx.userSolve.findUnique.mockResolvedValue(null) // not already solved
			tx.userSolve.upsert.mockResolvedValue({ id: "solve-1" })
			tx.dailyProblem.updateMany.mockResolvedValue({ count: 0 }) // loser — someone else already claimed
			pointsDao.applyPointsDelta.mockResolvedValue({
				newTotal: 127,
				crossedProThreshold: false,
			})
			tx.groupMember.findUnique.mockResolvedValue({ id: "member-1" })
			badgesDao.evaluateAndAward.mockResolvedValue([])

			await problemsDao.verifyAndMarkSolved("user-1")

			// FIRST_IN_GROUP must NOT be awarded when the atomic claim returns count=0
			const firstInGroupCall = (
				pointsDao.applyPointsDelta as ReturnType<typeof vi.fn>
			).mock.calls.find((c) => c[2] === PointReason.FIRST_IN_GROUP)
			expect(firstInGroupCall).toBeUndefined()
			// DAILY_SOLVE is still awarded
			expect(pointsDao.applyPointsDelta).toHaveBeenCalledWith(
				"user-1",
				5,
				PointReason.DAILY_SOLVE,
				{ tx, userSolveId: "solve-1" }
			)
		})

		it("already-solved re-entry short-circuits: no upsert, no DAILY_SOLVE award", async () => {
			const updatedToday = {
				...readyToday,
				solve: { id: "solve-1", status: SolveStatus.SOLVED, pointsEarned: 5 },
				groupSolvedCount: 1,
				userStats: { currentStreak: 5, longestStreak: 8, totalPoints: 137 },
			}
			vi.spyOn(problemsDao, "getTodayForUser")
				.mockResolvedValueOnce(readyToday)
				.mockResolvedValueOnce(updatedToday)
			db.user.findUniqueOrThrow.mockResolvedValue({
				leetcodeHandle: "alice",
				currentStreak: 4,
				longestStreak: 8,
				currentStreakStartedAt: new Date("2026-06-12T00:00:00.000Z"),
				verificationFailuresThisMonth: 0,
			})
			vi.stubGlobal(
				"fetch",
				vi.fn(async () => ({
					json: async () => ({
						data: {
							recentAcSubmissionList: [
								{
									titleSlug: "two-sum",
									timestamp: String(
										new Date("2026-06-16T02:00:00.000Z").getTime() / 1000
									),
								},
							],
						},
					}),
				}))
			)
			pointsDao.hasEverMissed.mockResolvedValue(false)
			// in-transaction re-check finds the solve already SOLVED → short-circuit
			tx.userSolve.findUnique.mockResolvedValue({ status: SolveStatus.SOLVED })

			await problemsDao.verifyAndMarkSolved("user-1")

			// upsert must not be called — the transaction bails early
			expect(tx.userSolve.upsert).not.toHaveBeenCalled()
			// no points awarded
			expect(pointsDao.applyPointsDelta).not.toHaveBeenCalled()
		})
	})

	describe("pauseToday", () => {
		it("returns NO_PAUSES without writing when the user has no pauses remaining", async () => {
			vi.spyOn(problemsDao, "getTodayForUser").mockResolvedValue({
				...readyToday,
				pausesRemaining: 0,
			})
			db.user.findUniqueOrThrow.mockResolvedValue({
				isPro: false,
				pausesUsedThisMonth: 2,
				currentStreak: 4,
				longestStreak: 8,
				totalPoints: 120,
			})

			const result = await problemsDao.pauseToday("user-1")

			expect(result.error).toBe("NO_PAUSES")
			expect(db.$transaction).not.toHaveBeenCalled()
			expect(pointsDao.applyPointsDelta).not.toHaveBeenCalled()
		})

		it("records a pause, consumes the monthly pause, applies the pause penalty, and resolves warnings", async () => {
			const updatedToday = {
				...readyToday,
				solve: { id: "solve-1", status: SolveStatus.PAUSED },
				pausesRemaining: 0,
			}
			vi.spyOn(problemsDao, "getTodayForUser")
				.mockResolvedValueOnce(readyToday)
				.mockResolvedValueOnce(updatedToday)
			db.user.findUniqueOrThrow.mockResolvedValue({
				isPro: false,
				pausesUsedThisMonth: 1,
				currentStreak: 4,
				longestStreak: 8,
				totalPoints: 120,
			})
			tx.userSolve.upsert.mockResolvedValue({ id: "solve-1" })
			tx.groupMember.findUnique.mockResolvedValue({ id: "member-1" })

			const result = await problemsDao.pauseToday("user-1")

			expect(result).toEqual({ error: null, today: updatedToday })
			expect(tx.userSolve.upsert).toHaveBeenCalledWith({
				where: {
					userId_dailyProblemId: {
						userId: "user-1",
						dailyProblemId: "daily-1",
					},
				},
				create: {
					userId: "user-1",
					dailyProblemId: "daily-1",
					status: SolveStatus.PAUSED,
				},
				update: { status: SolveStatus.PAUSED },
				select: { id: true },
			})
			expect(tx.user.update).toHaveBeenCalledWith({
				where: { id: "user-1" },
				data: { pausesUsedThisMonth: { increment: 1 } },
			})
			expect(pointsDao.applyPointsDelta).toHaveBeenCalledWith(
				"user-1",
				-5,
				PointReason.PAUSE,
				{ tx, userSolveId: "solve-1" }
			)
			expect(tx.groupMemberWarning.updateMany).toHaveBeenCalledWith({
				where: {
					groupMemberId: "member-1",
					resolvedAt: null,
				},
				data: {
					resolvedAt: expect.any(Date),
					resolution: "SOLVED_OR_PAUSED",
				},
			})
		})
	})

	describe("markMissedForDate", () => {
		it("marks only primary-group candidates without existing solves as missed", async () => {
			db.groupMember.findMany.mockResolvedValue([
				{
					id: "member-1",
					groupId: "group-1",
					userId: "user-1",
					role: MemberRole.MEMBER,
					group: { type: GroupType.PUBLIC },
				},
				{
					id: "member-2",
					groupId: "group-2",
					userId: "user-1",
					role: MemberRole.MEMBER,
					group: { type: GroupType.PUBLIC },
				},
				{
					id: "member-3",
					groupId: "group-1",
					userId: "user-2",
					role: MemberRole.MEMBER,
					group: { type: GroupType.PUBLIC },
				},
			])
			db.dailyProblem.findMany.mockResolvedValue([{ id: "daily-1", groupId: "group-1" }])
			db.userSolve.findMany
				.mockResolvedValueOnce([{ userId: "user-2", dailyProblemId: "daily-1" }])
				.mockResolvedValue([])
			db.user.findMany.mockResolvedValue([
				{
					id: "user-1",
					currentStreakStartedAt: new Date("2026-06-01T00:00:00.000Z"),
				},
				{ id: "user-2", currentStreakStartedAt: null },
			])
			tx.userSolve.create.mockResolvedValue({ id: "solve-1" })
			db.groupMemberWarning.findFirst.mockResolvedValue(null)

			const result = await problemsDao.markMissedForDate(
				new Date("2026-06-15T18:30:00.000Z")
			)

			expect(result).toEqual({ missed: 1, warned: 0, removed: 0 })
			expect(tx.userSolve.create).toHaveBeenCalledWith({
				data: {
					userId: "user-1",
					dailyProblemId: "daily-1",
					status: SolveStatus.MISSED,
					pointsEarned: 0,
				},
				select: { id: true },
			})
			expect(pointsDao.applyMissPenalty).toHaveBeenCalledWith(tx, "user-1", {
				userSolveId: "solve-1",
				streakStartedAt: new Date("2026-06-01T00:00:00.000Z"),
			})
			expect(pointsDao.applyMissPenalty).toHaveBeenCalledTimes(1)
		})

		it("creates an inactivity warning after five consecutive misses", async () => {
			db.groupMember.findMany.mockResolvedValue([
				{
					id: "member-1",
					groupId: "group-1",
					userId: "user-1",
					role: MemberRole.MEMBER,
					group: { type: GroupType.PUBLIC },
				},
			])
			db.dailyProblem.findMany.mockResolvedValue([{ id: "daily-1", groupId: "group-1" }])
			db.userSolve.findMany
				.mockResolvedValueOnce([{ userId: "user-1", dailyProblemId: "daily-1" }])
				.mockResolvedValue([
					{ status: SolveStatus.MISSED },
					{ status: SolveStatus.MISSED },
					{ status: SolveStatus.MISSED },
					{ status: SolveStatus.MISSED },
					{ status: SolveStatus.MISSED },
				])
			db.user.findMany.mockResolvedValue([{ id: "user-1", currentStreakStartedAt: null }])
			db.groupMemberWarning.findFirst.mockResolvedValue(null)

			const result = await problemsDao.markMissedForDate(
				new Date("2026-06-15T00:00:00.000Z")
			)

			expect(result).toEqual({ missed: 0, warned: 1, removed: 0 })
			expect(db.groupMemberWarning.create).toHaveBeenCalledWith({
				data: {
					groupMemberId: "member-1",
					warningMissedCount: 5,
				},
			})
			expect(groupNotifications.inactivityWarning).toHaveBeenCalledWith(
				"group-1",
				"user-1",
				5,
				GroupType.PUBLIC
			)
		})
	})
})
