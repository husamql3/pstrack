// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const tx = {
	featureFlag: {
		create: vi.fn(),
		update: vi.fn(),
	},
	systemConfig: {
		upsert: vi.fn(),
	},
}

vi.mock("@/server/lib/db", () => ({
	db: {
		$transaction: vi.fn(async (callback) => callback(tx)),
		featureFlag: {
			findMany: vi.fn(),
		},
		group: {
			count: vi.fn(),
		},
		systemConfig: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
		},
		user: {
			count: vi.fn(),
			findMany: vi.fn(),
		},
		userSolve: {
			count: vi.fn(),
			findMany: vi.fn(),
		},
	},
}))

vi.mock("./admin-audit.dao", () => ({
	adminAuditDao: {
		log: vi.fn(),
	},
}))

import { db } from "@/server/lib/db"
import { adminDao } from "./admin.dao"
import { adminAuditDao } from "./admin-audit.dao"

describe("adminDao", () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date("2026-06-16T12:00:00.000Z"))
		adminDao.invalidateStats()
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.clearAllMocks()
		adminDao.invalidateStats()
	})

	it("computes and caches dashboard stats for the TTL window", async () => {
		db.user.count
			.mockResolvedValueOnce(10)
			.mockResolvedValueOnce(2)
			.mockResolvedValueOnce(1)
		db.userSolve.findMany.mockResolvedValue([{ userId: "user-1" }, { userId: "user-2" }])
		db.group.count.mockResolvedValue(3)
		db.userSolve.count.mockResolvedValue(4)
		db.user.findMany.mockResolvedValue([
			{ createdAt: new Date("2026-06-16T01:00:00.000Z") },
			{ createdAt: new Date("2026-06-15T01:00:00.000Z") },
		])

		const first = await adminDao.getStats()
		const second = await adminDao.getStats()

		expect(first).toEqual(second)
		expect(db.user.count).toHaveBeenCalledTimes(3)
		expect(first.totals).toEqual({
			users: 10,
			activeUsers7d: 2,
			groups: 3,
			solvesToday: 4,
			proUsers: 2,
			signupsToday: 1,
		})
		expect(first.signups30d).toHaveLength(30)
		expect(first.signups30d.at(-1)).toEqual({ date: "2026-06-16", count: 1 })
	})

	it("caches feature flag lookups and defaults missing flags to false", async () => {
		db.featureFlag.findMany.mockResolvedValue([{ key: "new-dashboard", enabled: true }])

		await expect(adminDao.isFeatureEnabled("new-dashboard")).resolves.toBe(true)
		await expect(adminDao.isFeatureEnabled("missing")).resolves.toBe(false)

		expect(db.featureFlag.findMany).toHaveBeenCalledTimes(1)
	})

	it("toggles a feature flag in a transaction and writes an audit log", async () => {
		tx.featureFlag.update.mockResolvedValue({
			key: "new-dashboard",
			enabled: false,
			description: null,
			createdAt: new Date("2026-06-01T00:00:00.000Z"),
			updatedAt: new Date("2026-06-16T12:00:00.000Z"),
		})

		const row = await adminDao.toggleFeatureFlag("admin-1", "new-dashboard", false)

		expect(row).toMatchObject({ key: "new-dashboard", enabled: false })
		expect(tx.featureFlag.update).toHaveBeenCalledWith({
			where: { key: "new-dashboard" },
			data: { enabled: false },
			select: expect.any(Object),
		})
		expect(adminAuditDao.log).toHaveBeenCalledWith(
			{
				adminId: "admin-1",
				action: "FEATURE_FLAG_TOGGLED",
				target: { type: "FEATURE_FLAG", id: "new-dashboard" },
				metadata: { key: "new-dashboard", enabled: false },
			},
			tx
		)
	})

	it("upserts system config and records the admin action", async () => {
		tx.systemConfig.upsert.mockResolvedValue({
			key: "dailyProblemEnabled",
			value: true,
			description: "Toggle daily assignment",
			createdAt: new Date("2026-06-01T00:00:00.000Z"),
			updatedAt: new Date("2026-06-16T12:00:00.000Z"),
		})

		const row = await adminDao.upsertSystemConfig("admin-1", {
			key: "dailyProblemEnabled",
			value: true,
			description: "Toggle daily assignment",
		})

		expect(row).toMatchObject({ key: "dailyProblemEnabled", value: true })
		expect(tx.systemConfig.upsert).toHaveBeenCalledWith({
			where: { key: "dailyProblemEnabled" },
			create: {
				key: "dailyProblemEnabled",
				value: true,
				description: "Toggle daily assignment",
			},
			update: {
				value: true,
				description: "Toggle daily assignment",
			},
			select: expect.any(Object),
		})
		expect(adminAuditDao.log).toHaveBeenCalledWith(
			{
				adminId: "admin-1",
				action: "SYSTEM_CONFIG_UPDATED",
				target: { type: "SYSTEM_CONFIG", id: "dailyProblemEnabled" },
				metadata: { key: "dailyProblemEnabled" },
			},
			tx
		)
	})
})
