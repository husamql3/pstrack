// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const tx = {
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
		update: vi.fn(),
	},
	userSolve: {
		create: vi.fn(),
		upsert: vi.fn(),
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

	describe("verifyAndMarkSolved", () => {
		it("awards solve points, first-in-group, early-bird, updates streaks, and evaluates badges when LeetCode verifies", async () => {
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
			db.userSolve.count.mockResolvedValue(0)
			pointsDao.hasEverMissed.mockResolvedValue(false)
			tx.userSolve.upsert.mockResolvedValue({ id: "solve-1" })
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
			expect(tx.userSolve.upsert).toHaveBeenCalledWith({
				where: { userId_dailyProblemId: { userId: "user-1", dailyProblemId: "daily-1" } },
				create: {
					userId: "user-1",
					dailyProblemId: "daily-1",
					status: SolveStatus.SOLVED,
					pointsEarned: 5,
					isFirstInGroup: true,
					verifiedAt: expect.any(Date),
				},
				update: {
					status: SolveStatus.SOLVED,
					pointsEarned: 5,
					isFirstInGroup: true,
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
			expect(tx.dailyProblem.update).toHaveBeenCalledWith({
				where: { id: "daily-1" },
				data: { firstSolverId: "user-1", firstSolveTime: expect.any(Date) },
			})
			expect(tx.user.update).toHaveBeenCalledWith({
				where: { id: "user-1" },
				data: {
					currentStreak: 5,
					longestStreak: 8,
				},
			})
			expect(badgesDao.evaluateAndAward).toHaveBeenCalledWith(tx, "user-1", 5)
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

		it("penalizes repeated verification failures by marking the solve missed", async () => {
			const penalizedToday = {
				...readyToday,
				solve: { id: "solve-1", status: SolveStatus.MISSED, pointsEarned: 0 },
			}
			vi.spyOn(problemsDao, "getTodayForUser")
				.mockResolvedValueOnce(readyToday)
				.mockResolvedValueOnce(penalizedToday)
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
			tx.userSolve.upsert.mockResolvedValue({ id: "solve-1" })

			const result = await problemsDao.verifyAndMarkSolved("user-1")

			expect(result).toEqual({
				error: "VERIFICATION_FAILED_PENALIZED",
				today: penalizedToday,
			})
			expect(tx.user.update).toHaveBeenCalledWith({
				where: { id: "user-1" },
				data: { verificationFailuresThisMonth: 2 },
			})
			expect(tx.userSolve.upsert).toHaveBeenCalledWith({
				where: { userId_dailyProblemId: { userId: "user-1", dailyProblemId: "daily-1" } },
				create: {
					userId: "user-1",
					dailyProblemId: "daily-1",
					status: SolveStatus.MISSED,
					pointsEarned: 0,
				},
				update: { status: SolveStatus.MISSED },
				select: { id: true },
			})
			expect(pointsDao.applyMissPenalty).toHaveBeenCalledWith(tx, "user-1", {
				userSolveId: "solve-1",
				streakStartedAt: new Date("2026-06-12T00:00:00.000Z"),
			})
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
