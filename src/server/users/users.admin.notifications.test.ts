// @ts-nocheck
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/env", () => ({
	env: {
		BETTER_AUTH_URL: "https://pstrack.localhost/",
		EMAIL_FROM: "PStrack <pro@pstrack.localhost>",
	},
}))

vi.mock("@/emails/pro-unlocked-by-admin", () => ({
	default: vi.fn((props) => ({ type: "ProUnlockedByAdminEmail", props })),
}))

vi.mock("@/server/lib/email", () => ({
	sendEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/server/lib/sentry", () => ({
	captureServerException: vi.fn(),
}))

import ProUnlockedByAdminEmail from "@/emails/pro-unlocked-by-admin"
import { sendEmail } from "@/server/lib/email"
import { usersAdminNotifications } from "./users.admin.notifications"

describe("usersAdminNotifications.proGranted", () => {
	afterEach(() => vi.clearAllMocks())

	it("sends a permanent admin grant without an expiry", () => {
		usersAdminNotifications.proGranted("ada@example.com", "Ada", null)

		expect(ProUnlockedByAdminEmail).toHaveBeenCalledWith({
			name: "Ada",
			dashboardUrl: "https://pstrack.localhost/dashboard",
			expiresAt: null,
		})
		expect(sendEmail).toHaveBeenCalledTimes(1)
	})

	it("formats a temporary grant expiry in UTC", () => {
		usersAdminNotifications.proGranted(
			"ada@example.com",
			"Ada",
			new Date("2026-07-30T12:00:00.000Z")
		)

		expect(ProUnlockedByAdminEmail).toHaveBeenCalledWith(
			expect.objectContaining({ expiresAt: "July 30, 2026 at 12:00 PM UTC" })
		)
	})
})
