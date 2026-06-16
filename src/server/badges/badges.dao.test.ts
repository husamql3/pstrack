// @ts-nocheck
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/server/lib/db", () => ({
	db: {
		pointsHistory: { count: vi.fn() },
		user: { findUnique: vi.fn() },
		userSolve: { count: vi.fn(), findMany: vi.fn() },
	},
}))

import { BadgeType, PointReason, SolveStatus } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { badgesDao } from "./badges.dao"

const tx = {
	pointsHistory: {
		count: vi.fn(),
	},
	problem: {
		count: vi.fn(),
	},
	userBadge: {
		createMany: vi.fn(),
		findMany: vi.fn(),
	},
	userSolve: {
		count: vi.fn(),
		findMany: vi.fn(),
	},
}

describe("badgesDao", () => {
	afterEach(() => vi.clearAllMocks())

	describe("evaluateAndAward", () => {
		it("awards newly earned streak, volume, roadmap, social, and consistency badges", async () => {
			tx.userBadge.findMany.mockResolvedValue([{ type: BadgeType.SOLVED_1 }])
			tx.userSolve.findMany.mockResolvedValue([
				{
					dailyProblem: {
						problemId: "p1",
						problem: { neetcode250: true, neetcode150: true, blind75: true },
					},
				},
				{
					dailyProblem: {
						problemId: "p1",
						problem: { neetcode250: true, neetcode150: true, blind75: true },
					},
				},
				{
					dailyProblem: {
						problemId: "p2",
						problem: { neetcode250: true, neetcode150: false, blind75: false },
					},
				},
			])
			tx.pointsHistory.count.mockResolvedValue(10)
			tx.userSolve.count.mockResolvedValue(30)
			tx.problem.count
				.mockResolvedValueOnce(2)
				.mockResolvedValueOnce(1)
				.mockResolvedValueOnce(1)

			const awarded = await badgesDao.evaluateAndAward(tx, "user-1", 30)

			expect(awarded).toEqual([
				BadgeType.STREAK_7,
				BadgeType.STREAK_30,
				BadgeType.NC250_COMPLETE,
				BadgeType.NC150_COMPLETE,
				BadgeType.BLIND75_COMPLETE,
				BadgeType.FIRST_SOLVER_1,
				BadgeType.FIRST_SOLVER_10,
				BadgeType.CONSISTENT_30,
			])
			expect(tx.userBadge.createMany).toHaveBeenCalledWith({
				data: awarded.map((type) => ({ userId: "user-1", type })),
				skipDuplicates: true,
			})
		})

		it("does not create rows when no new badges are earned", async () => {
			tx.userBadge.findMany.mockResolvedValue([
				{ type: BadgeType.STREAK_7 },
				{ type: BadgeType.SOLVED_1 },
			])
			tx.userSolve.findMany.mockResolvedValue([
				{
					dailyProblem: {
						problemId: "p1",
						problem: { neetcode250: true, neetcode150: false, blind75: false },
					},
				},
			])
			tx.pointsHistory.count.mockResolvedValue(0)
			tx.userSolve.count.mockResolvedValue(0)
			tx.problem.count
				.mockResolvedValueOnce(250)
				.mockResolvedValueOnce(150)
				.mockResolvedValueOnce(75)

			const awarded = await badgesDao.evaluateAndAward(tx, "user-1", 7)

			expect(awarded).toEqual([])
			expect(tx.userBadge.createMany).not.toHaveBeenCalled()
		})
	})

	describe("computeProgress", () => {
		it("counts unique solved problems per roadmap and includes social/monthly progress", async () => {
			db.user.findUnique.mockResolvedValue({ currentStreak: 12 })
			db.userSolve.findMany.mockResolvedValue([
				{
					dailyProblem: {
						problemId: "p1",
						problem: { neetcode250: true, neetcode150: true, blind75: false },
					},
				},
				{
					dailyProblem: {
						problemId: "p1",
						problem: { neetcode250: true, neetcode150: true, blind75: false },
					},
				},
				{
					dailyProblem: {
						problemId: "p2",
						problem: { neetcode250: true, neetcode150: false, blind75: true },
					},
				},
			])
			db.pointsHistory.count.mockResolvedValue(4)
			db.userSolve.count.mockResolvedValue(9)

			const progress = await badgesDao.computeProgress("user-1")

			expect(db.userSolve.findMany).toHaveBeenCalledWith({
				where: { userId: "user-1", status: SolveStatus.SOLVED },
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
			})
			expect(db.pointsHistory.count).toHaveBeenCalledWith({
				where: { userId: "user-1", reason: PointReason.FIRST_IN_GROUP },
			})
			expect(progress).toEqual({
				currentStreak: 12,
				uniqueSolveCount: 2,
				nc250SolvedCount: 2,
				nc150SolvedCount: 1,
				blind75SolvedCount: 1,
				firstSolverCount: 4,
				monthSolveCount: 9,
			})
		})
	})
})
