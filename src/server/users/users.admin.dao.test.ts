// @ts-nocheck
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/server/admin/admin-audit.dao", () => ({
	adminAuditDao: { log: vi.fn() },
}))

vi.mock("@/server/lib/db", () => ({
	db: {
		user: { findUnique: vi.fn() },
		$transaction: vi.fn(),
	},
}))

vi.mock("@/server/points/points.dao", () => ({
	pointsDao: { applyPointsDelta: vi.fn() },
}))

import { ProSource } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { usersAdminDao } from "./users.admin.dao"

const updatedUser = {
	id: "user-1",
	name: "Ada",
	email: "ada@example.com",
	isPro: true,
	proSource: ProSource.ADMIN_GRANT,
	proExpiresAt: null,
}

describe("usersAdminDao.setPro", () => {
	afterEach(() => vi.clearAllMocks())

	const arrangeTransaction = () => {
		const tx = {
			user: { update: vi.fn().mockResolvedValue(updatedUser) },
		}
		db.$transaction.mockImplementation((callback) => callback(tx))
	}

	it("marks a Free to Pro admin grant as a transition", async () => {
		db.user.findUnique.mockResolvedValue({ isPro: false, proSource: null })
		arrangeTransaction()

		const result = await usersAdminDao.setPro("admin-1", "user-1", {
			grant: true,
			expiresAt: null,
			reason: "Great performance",
		})

		expect(result).toMatchObject({ ok: true, becamePro: true })
	})

	it("does not mark an existing Pro re-grant as a transition", async () => {
		db.user.findUnique.mockResolvedValue({
			isPro: true,
			proSource: ProSource.ADMIN_GRANT,
		})
		arrangeTransaction()

		const result = await usersAdminDao.setPro("admin-1", "user-1", {
			grant: true,
			expiresAt: new Date("2026-07-30T12:00:00.000Z"),
			reason: "Extend grant",
		})

		expect(result).toMatchObject({ ok: true, becamePro: false })
	})
})
