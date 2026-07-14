import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
	env: {
		EMAIL_FROM: "PStrack <test@example.com>",
		NODE_ENV: "development",
	},
	loggerDebug: vi.fn(),
	loggerError: vi.fn(),
	loggerWarn: vi.fn(),
	sendEmail: vi.fn(),
}))

vi.mock("@/env", () => ({ env: mocks.env }))
vi.mock("@/server/lib/email", () => ({ sendEmail: mocks.sendEmail }))
vi.mock("@/server/lib/logger", () => ({
	logger: {
		debug: mocks.loggerDebug,
		error: mocks.loggerError,
		warn: mocks.loggerWarn,
	},
}))
vi.mock("@/emails/magic-link", () => ({
	default: ({ url }: { url: string }) => ({ type: "MagicLinkEmail", props: { url } }),
}))

import { sendMagicLinkEmail } from "./magic-link-email"

describe("sendMagicLinkEmail", () => {
	beforeEach(() => {
		mocks.env.NODE_ENV = "development"
		mocks.sendEmail.mockReset()
		mocks.loggerDebug.mockReset()
		mocks.loggerError.mockReset()
		mocks.loggerWarn.mockReset()
	})

	it("does not throw in development when Resend cannot send", async () => {
		mocks.sendEmail.mockRejectedValueOnce(new Error("Resend unavailable"))

		await expect(
			sendMagicLinkEmail({
				email: "user@example.com",
				url: "https://pstrack.localhost/api/v3/auth/magic-link/verify?token=abc",
			})
		).resolves.toBeUndefined()

		expect(mocks.loggerError).toHaveBeenCalledWith({}, "magic link email failed")
		expect(mocks.loggerWarn).toHaveBeenCalledWith(
			{},
			"magic link email failure suppressed in development"
		)
		const logged = JSON.stringify([
			...mocks.loggerDebug.mock.calls,
			...mocks.loggerError.mock.calls,
			...mocks.loggerWarn.mock.calls,
		])
		expect(logged).not.toContain("user@example.com")
		expect(logged).not.toContain("token=abc")
		expect(logged).not.toContain("Resend unavailable")
	})

	it("rethrows email failures outside development", async () => {
		mocks.env.NODE_ENV = "production"
		mocks.sendEmail.mockRejectedValueOnce(new Error("Resend unavailable"))

		await expect(
			sendMagicLinkEmail({
				email: "user@example.com",
				url: "https://pstrack.localhost/api/v3/auth/magic-link/verify?token=abc",
			})
		).rejects.toThrow("Magic link email failed")
		expect(mocks.loggerError).toHaveBeenCalledWith({}, "magic link email failed")
	})
})
