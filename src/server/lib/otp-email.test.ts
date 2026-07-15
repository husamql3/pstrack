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
vi.mock("@/emails/otp-code", () => ({
	default: ({ otp, type }: { otp: string; type: string }) => ({
		type: "OtpCodeEmail",
		props: { otp, type },
	}),
}))

import { sendOtpEmail } from "./otp-email"

describe("sendOtpEmail", () => {
	beforeEach(() => {
		mocks.env.NODE_ENV = "development"
		mocks.sendEmail.mockReset()
		mocks.loggerDebug.mockReset()
		mocks.loggerError.mockReset()
		mocks.loggerWarn.mockReset()
	})

	it("sends the code with the type-specific subject", async () => {
		mocks.sendEmail.mockResolvedValueOnce({ id: "1" })

		await sendOtpEmail({
			email: "new@example.com",
			otp: "123456",
			type: "change-email",
		})

		expect(mocks.sendEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "new@example.com",
				subject: "Confirm your new PStrack email",
			})
		)
	})

	it("does not throw in development when Resend cannot send", async () => {
		mocks.sendEmail.mockRejectedValueOnce(new Error("Resend unavailable"))

		await expect(
			sendOtpEmail({
				email: "user@example.com",
				otp: "654321",
				type: "email-verification",
			})
		).resolves.toBeUndefined()

		expect(mocks.loggerWarn).toHaveBeenCalledWith(
			expect.objectContaining({
				email: "user@example.com",
				otp: "654321",
				type: "email-verification",
			}),
			"otp email failed in development; using logged code fallback"
		)
	})

	it("rethrows email failures outside development", async () => {
		mocks.env.NODE_ENV = "production"
		mocks.sendEmail.mockRejectedValueOnce(new Error("Resend unavailable"))

		await expect(
			sendOtpEmail({
				email: "user@example.com",
				otp: "654321",
				type: "change-email",
			})
		).rejects.toThrow("Resend unavailable")
	})
})
