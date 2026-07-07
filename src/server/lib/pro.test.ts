// @ts-nocheck
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/env", () => ({
	env: {
		BETTER_AUTH_URL: "https://pstrack.localhost/",
		EMAIL_FROM: "PStrack <pro@pstrack.localhost>",
	},
}))

vi.mock("@/emails/pro-unlocked-by-purchase", () => ({
	default: vi.fn((props) => ({ type: "ProUnlockedByPurchaseEmail", props })),
}))

vi.mock("@/server/lib/db", () => ({
	db: {
		user: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}))

vi.mock("@/server/lib/email", () => ({
	sendEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/server/lib/sentry", () => ({
	captureServerException: vi.fn(),
}))

vi.mock("@/server/lib/logger", () => ({
	logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { ProSource } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { sendEmail } from "@/server/lib/email"
import { logger } from "@/server/lib/logger"
import { grantProFromPurchase, revokeProFromRefund } from "./pro"

const baseUser = {
	id: "u1",
	email: "a@example.com",
	emailVerified: true,
	name: "Ada",
	isPro: false,
	proSource: null,
}

describe("grantProFromPurchase", () => {
	afterEach(() => vi.clearAllMocks())

	it("grants lifetime purchase Pro to a new buyer resolved via externalId and emails them", async () => {
		db.user.findUnique.mockResolvedValueOnce({ ...baseUser })

		await grantProFromPurchase({ externalId: "u1", email: "a@example.com" })

		expect(db.user.update).toHaveBeenCalledWith({
			where: { id: "u1" },
			data: { isPro: true, proSource: ProSource.POLAR_PURCHASE, proExpiresAt: null },
		})
		expect(sendEmail).toHaveBeenCalledTimes(1)
	})

	it("is idempotent when the user already holds purchase-sourced Pro (no update, no email)", async () => {
		db.user.findUnique.mockResolvedValueOnce({
			...baseUser,
			isPro: true,
			proSource: ProSource.POLAR_PURCHASE,
		})

		await grantProFromPurchase({ externalId: "u1" })

		expect(db.user.update).not.toHaveBeenCalled()
		expect(sendEmail).not.toHaveBeenCalled()
	})

	it("does NOT overwrite an earned (points) source and sends no email when an existing Pro buys", async () => {
		db.user.findUnique.mockResolvedValueOnce({
			...baseUser,
			isPro: true,
			proSource: ProSource.POINTS_THRESHOLD,
		})

		await grantProFromPurchase({ externalId: "u1" })

		// isPro stays true; proSource is preserved (NOT stamped POLAR_PURCHASE) so a
		// later refund can't revoke independently-earned Pro.
		expect(db.user.update).toHaveBeenCalledWith({
			where: { id: "u1" },
			data: { isPro: true },
		})
		expect(sendEmail).not.toHaveBeenCalled()
	})

	it("does not grant when no user resolves (logs, no update)", async () => {
		db.user.findUnique.mockResolvedValue(null)

		await grantProFromPurchase({ externalId: "ghost", email: "nobody@example.com" })

		expect(db.user.update).not.toHaveBeenCalled()
		expect(logger.error).toHaveBeenCalled()
	})

	it("rejects the email fallback for an unverified address", async () => {
		// externalId absent → email branch; email exists but is unverified → no grant.
		db.user.findUnique.mockResolvedValueOnce({ ...baseUser, emailVerified: false })

		await grantProFromPurchase({ email: "a@example.com" })

		expect(db.user.update).not.toHaveBeenCalled()
	})

	it("accepts the email fallback for a verified address and warns", async () => {
		db.user.findUnique.mockResolvedValueOnce({ ...baseUser, emailVerified: true })

		await grantProFromPurchase({ email: "a@example.com" })

		expect(db.user.update).toHaveBeenCalledWith({
			where: { id: "u1" },
			data: { isPro: true, proSource: ProSource.POLAR_PURCHASE, proExpiresAt: null },
		})
		expect(logger.warn).toHaveBeenCalled()
	})
})

describe("revokeProFromRefund", () => {
	afterEach(() => vi.clearAllMocks())

	it("revokes Pro when the account's Pro came from a purchase", async () => {
		db.user.findUnique.mockResolvedValueOnce({
			...baseUser,
			isPro: true,
			proSource: ProSource.POLAR_PURCHASE,
		})

		await revokeProFromRefund({ externalId: "u1" })

		expect(db.user.update).toHaveBeenCalledWith({
			where: { id: "u1" },
			data: { isPro: false, proSource: null, proExpiresAt: null },
		})
	})

	it("does NOT revoke Pro earned via points (protects earned Pro from refund griefing)", async () => {
		db.user.findUnique.mockResolvedValueOnce({
			...baseUser,
			isPro: true,
			proSource: ProSource.POINTS_THRESHOLD,
		})

		await revokeProFromRefund({ externalId: "u1" })

		expect(db.user.update).not.toHaveBeenCalled()
	})

	it("is a no-op when no user resolves", async () => {
		db.user.findUnique.mockResolvedValue(null)

		await revokeProFromRefund({ externalId: "ghost" })

		expect(db.user.update).not.toHaveBeenCalled()
	})
})
