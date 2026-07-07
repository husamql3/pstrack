// @ts-nocheck
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/server/lib/db", () => ({
	db: {
		group: { findUnique: vi.fn() },
		groupMember: { findMany: vi.fn() },
		pointsHistory: { groupBy: vi.fn() },
	},
}))

import { db } from "@/server/lib/db"
import { leaderboardDao } from "./leaderboard.dao"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeUser = (id: string, totalPoints = 0) => ({
	id,
	username: `user-${id}`,
	name: `User ${id}`,
	isPro: false,
	currentStreak: 0,
	totalPoints,
})

const makeGroup = (id = "group-1") => ({
	id,
	slug: `slug-${id}`,
	_count: { members: 3 },
})

describe("leaderboardDao.getGroupLeaderboard", () => {
	afterEach(() => vi.clearAllMocks())

	describe("week period (non-alltime)", () => {
		it("issues exactly one groupBy — not one aggregate per member", async () => {
			const members = [
				{ user: makeUser("u1", 100) },
				{ user: makeUser("u2", 200) },
				{ user: makeUser("u3", 300) },
			]

			db.group.findUnique.mockResolvedValue(makeGroup())
			db.groupMember.findMany.mockResolvedValue(members)
			// u3 has earned 50 pts this week; u1 and u2 have no windowed history
			db.pointsHistory.groupBy.mockResolvedValue([{ userId: "u3", _sum: { delta: 50 } }])

			await leaderboardDao.getGroupLeaderboard("group-1", "week")

			// One groupBy call, never aggregate
			expect(db.pointsHistory.groupBy).toHaveBeenCalledOnce()
		})

		it("a member absent from the groupBy result gets periodPoints: 0", async () => {
			const members = [
				{ user: makeUser("u1", 100) },
				{ user: makeUser("u2", 200) },
				{ user: makeUser("u3", 300) },
			]

			db.group.findUnique.mockResolvedValue(makeGroup())
			db.groupMember.findMany.mockResolvedValue(members)
			// Only u3 appears in the windowed result
			db.pointsHistory.groupBy.mockResolvedValue([{ userId: "u3", _sum: { delta: 50 } }])

			const result = await leaderboardDao.getGroupLeaderboard("group-1", "week")

			const byUserId = Object.fromEntries(
				result.entries.map((e) => [e.userId, e.periodPoints])
			)
			expect(byUserId.u1).toBe(0) // absent → 0
			expect(byUserId.u2).toBe(0) // absent → 0
			expect(byUserId.u3).toBe(50) // present → summed delta
		})

		it("passes all member userIds as an IN filter to the single groupBy call", async () => {
			const members = [
				{ user: makeUser("u1") },
				{ user: makeUser("u2") },
				{ user: makeUser("u3") },
			]

			db.group.findUnique.mockResolvedValue(makeGroup())
			db.groupMember.findMany.mockResolvedValue(members)
			db.pointsHistory.groupBy.mockResolvedValue([])

			await leaderboardDao.getGroupLeaderboard("group-1", "week")

			const [callArgs] = db.pointsHistory.groupBy.mock.calls
			expect(callArgs[0].where.userId).toEqual({ in: ["u1", "u2", "u3"] })
		})
	})

	describe("alltime period", () => {
		it("uses totalPoints from the denormalized cache and issues no groupBy", async () => {
			const members = [{ user: makeUser("u1", 100) }, { user: makeUser("u2", 200) }]

			db.group.findUnique.mockResolvedValue(makeGroup())
			db.groupMember.findMany.mockResolvedValue(members)

			const result = await leaderboardDao.getGroupLeaderboard("group-1", "alltime")

			// No groupBy issued at all
			expect(db.pointsHistory.groupBy).not.toHaveBeenCalled()

			// periodPoints comes from totalPoints (the denormalized cache)
			const byUserId = Object.fromEntries(
				result.entries.map((e) => [e.userId, e.periodPoints])
			)
			expect(byUserId.u1).toBe(100)
			expect(byUserId.u2).toBe(200)
		})
	})

	describe("group not found", () => {
		it("returns null when the group does not exist", async () => {
			db.group.findUnique.mockResolvedValue(null)

			const result = await leaderboardDao.getGroupLeaderboard("nonexistent", "week")

			expect(result).toBeNull()
			expect(db.pointsHistory.groupBy).not.toHaveBeenCalled()
		})
	})
})
