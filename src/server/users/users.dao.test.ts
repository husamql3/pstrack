// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/server/lib/db", () => ({
	db: {
		user: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}))

import { db } from "@/server/lib/db"
import { PRO_THRESHOLD } from "@/server/points/points.type"
import { usersDao } from "./users.dao"

const meRow = {
	id: "user-1",
	name: "Alice",
	email: "alice@example.com",
	emailVerified: true,
	username: "alice",
	leetcodeHandle: "alice-lc",
	codeforcesHandle: null,
	bio: null,
	twitterHandle: null,
	linkedinHandle: null,
	websiteUrl: null,
	isPublic: true,
	isPro: false,
	proSource: null,
	totalPoints: 120,
	currentStreak: 4,
	longestStreak: 8,
	pausesUsedThisMonth: 1,
	verificationFailuresThisMonth: 0,
	notifyDailyProblem: true,
	notifyAchievements: true,
	notifyGroupActivity: true,
	usernameChangedAt: null,
	createdAt: new Date("2026-01-01T00:00:00.000Z"),
}

describe("usersDao", () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date("2026-06-16T12:00:00.000Z"))
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.clearAllMocks()
	})

	it("findMe derives monthly limits, verification grace, username cooldown, and points to Pro", async () => {
		db.user.findUnique.mockResolvedValue({
			...meRow,
			usernameChangedAt: new Date("2026-06-01T12:00:00.000Z"),
		})

		const me = await usersDao.findMe("user-1")

		expect(me).toMatchObject({
			id: "user-1",
			pausesRemainingThisMonth: 1,
			verificationFailuresRemainingThisMonth: 1,
			pointsToProUnlock: PRO_THRESHOLD - 120,
		})
		expect(me?.usernameNextChangeAt).toEqual(new Date("2026-07-01T12:00:00.000Z"))
	})

	it("returns only safe profile fields when a public profile is private", async () => {
		db.user.findUnique.mockResolvedValue({
			id: "user-1",
			name: "Alice",
			username: "alice",
			isPublic: false,
			isPro: true,
			bio: "hidden",
			badges: [{ type: "SOLVED_1" }],
		})

		const profile = await usersDao.findPublicProfile("Alice")

		expect(db.user.findUnique).toHaveBeenCalledWith({
			where: { username: "alice" },
			select: expect.any(Object),
		})
		expect(profile).toEqual({
			visibility: "PRIVATE",
			username: "alice",
			name: "Alice",
			isPro: true,
		})
	})

	it("blocks username changes while the cooldown is active", async () => {
		db.user.findUnique.mockResolvedValueOnce({
			username: "alice",
			usernameChangedAt: new Date("2026-06-01T12:00:00.000Z"),
		})

		const result = await usersDao.updateUsername("user-1", "bob")

		expect(result).toEqual({
			error: "COOLDOWN",
			nextChangeAt: new Date("2026-07-01T12:00:00.000Z"),
		})
		expect(db.user.update).not.toHaveBeenCalled()
	})

	it("normalizes and saves a username when it is available", async () => {
		db.user.findUnique
			.mockResolvedValueOnce({ username: "alice", usernameChangedAt: null })
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ ...meRow, username: "bob" })

		const result = await usersDao.updateUsername("user-1", "BOB")

		expect(db.user.update).toHaveBeenCalledWith({
			where: { id: "user-1" },
			data: { username: "bob", usernameChangedAt: expect.any(Date) },
		})
		expect(result).toMatchObject({ error: null, me: { username: "bob" } })
	})
})
