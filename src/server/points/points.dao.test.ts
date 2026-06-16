// @ts-nocheck
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/server/lib/db", () => ({
	db: {
		$transaction: vi.fn(async (callback) => callback(tx)),
		pointsHistory: { findFirst: vi.fn() },
	},
}))

import { PointReason, ProSource } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { pointsDao } from "./points.dao"

const tx = {
	pointsHistory: {
		create: vi.fn(),
		aggregate: vi.fn(),
		findFirst: vi.fn(),
	},
	user: {
		findUniqueOrThrow: vi.fn(),
		update: vi.fn(),
	},
}

describe("pointsDao", () => {
	afterEach(() => vi.clearAllMocks())

	describe("applyPointsDelta", () => {
		it("writes an immutable ledger row and updates the cached total", async () => {
			tx.user.findUniqueOrThrow.mockResolvedValue({ totalPoints: 12, isPro: false })

			const result = await pointsDao.applyPointsDelta(
				"user-1",
				10,
				PointReason.DAILY_SOLVE,
				{
					groupId: "group-1",
					userSolveId: "solve-1",
				}
			)

			expect(db.$transaction).toHaveBeenCalledOnce()
			expect(tx.pointsHistory.create).toHaveBeenCalledWith({
				data: {
					userId: "user-1",
					delta: 10,
					reason: PointReason.DAILY_SOLVE,
					groupId: "group-1",
					userSolveId: "solve-1",
					adminNote: null,
				},
			})
			expect(tx.user.update).toHaveBeenCalledWith({
				where: { id: "user-1" },
				data: { totalPoints: 22 },
			})
			expect(result).toEqual({ newTotal: 22, crossedProThreshold: false })
		})

		it("never lets a negative delta push total points below zero", async () => {
			tx.user.findUniqueOrThrow.mockResolvedValue({ totalPoints: 2, isPro: false })

			const result = await pointsDao.applyPointsDelta("user-1", -5, PointReason.PAUSE, {
				tx,
			})

			expect(tx.user.update).toHaveBeenCalledWith({
				where: { id: "user-1" },
				data: { totalPoints: 0 },
			})
			expect(result).toEqual({ newTotal: 0, crossedProThreshold: false })
		})

		it("unlocks pro exactly when the user crosses the points threshold", async () => {
			tx.user.findUniqueOrThrow.mockResolvedValue({ totalPoints: 2995, isPro: false })

			const result = await pointsDao.applyPointsDelta(
				"user-1",
				10,
				PointReason.DAILY_SOLVE,
				{ tx }
			)

			expect(tx.user.update).toHaveBeenCalledWith({
				where: { id: "user-1" },
				data: {
					totalPoints: 3005,
					isPro: true,
					proSource: ProSource.POINTS_THRESHOLD,
				},
			})
			expect(result).toEqual({ newTotal: 3005, crossedProThreshold: true })
		})

		it("does not overwrite pro source for users who are already pro", async () => {
			tx.user.findUniqueOrThrow.mockResolvedValue({ totalPoints: 2995, isPro: true })

			const result = await pointsDao.applyPointsDelta(
				"user-1",
				10,
				PointReason.DAILY_SOLVE,
				{ tx }
			)

			expect(tx.user.update).toHaveBeenCalledWith({
				where: { id: "user-1" },
				data: { totalPoints: 3005 },
			})
			expect(result).toEqual({ newTotal: 3005, crossedProThreshold: false })
		})
	})

	describe("applyMissPenalty", () => {
		it("claws back streak bonuses before applying the missed-day penalty", async () => {
			tx.pointsHistory.aggregate.mockResolvedValue({ _sum: { delta: 12 } })
			tx.user.findUniqueOrThrow
				.mockResolvedValueOnce({ totalPoints: 50, isPro: false })
				.mockResolvedValueOnce({ totalPoints: 38, isPro: false })

			await pointsDao.applyMissPenalty(tx, "user-1", {
				userSolveId: "solve-1",
				streakStartedAt: new Date("2026-06-01T00:00:00.000Z"),
			})

			expect(tx.pointsHistory.aggregate).toHaveBeenCalledWith({
				where: {
					userId: "user-1",
					createdAt: { gte: new Date("2026-06-01T00:00:00.000Z") },
					reason: {
						in: [PointReason.STREAK_MULTIPLIER_BONUS, PointReason.FIRST_IN_GROUP],
					},
				},
				_sum: { delta: true },
			})
			expect(tx.pointsHistory.create).toHaveBeenNthCalledWith(1, {
				data: {
					userId: "user-1",
					delta: -12,
					reason: PointReason.CLAWBACK,
					groupId: null,
					userSolveId: "solve-1",
					adminNote: null,
				},
			})
			expect(tx.pointsHistory.create).toHaveBeenNthCalledWith(2, {
				data: {
					userId: "user-1",
					delta: -3,
					reason: PointReason.MISSED_DAY,
					groupId: null,
					userSolveId: "solve-1",
					adminNote: null,
				},
			})
			expect(tx.user.update).toHaveBeenLastCalledWith({
				where: { id: "user-1" },
				data: { currentStreak: 0, currentStreakStartedAt: null },
			})
		})

		it("applies only the missed-day penalty when there is no active streak", async () => {
			tx.user.findUniqueOrThrow.mockResolvedValue({ totalPoints: 10, isPro: false })

			await pointsDao.applyMissPenalty(tx, "user-1", {
				userSolveId: "solve-1",
				streakStartedAt: null,
			})

			expect(tx.pointsHistory.aggregate).not.toHaveBeenCalled()
			expect(tx.pointsHistory.create).toHaveBeenCalledOnce()
			expect(tx.pointsHistory.create).toHaveBeenCalledWith({
				data: {
					userId: "user-1",
					delta: -3,
					reason: PointReason.MISSED_DAY,
					groupId: null,
					userSolveId: "solve-1",
					adminNote: null,
				},
			})
			expect(tx.user.update).toHaveBeenLastCalledWith({
				where: { id: "user-1" },
				data: { currentStreak: 0, currentStreakStartedAt: null },
			})
		})
	})
})
