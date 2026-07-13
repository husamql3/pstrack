import { createElement } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
	send: vi.fn(),
	sendMail: vi.fn(),
	render: vi.fn(),
	debug: vi.fn(),
	info: vi.fn(),
	error: vi.fn(),
	env: {
		EMAIL_TRANSPORT: "log" as "log" | "resend" | "smtp",
		RESEND_API_KEY: "unused-in-log-mode",
		SMTP_HOST: "mail.pstrack.app",
		SMTP_PORT: 587,
		SMTP_USER: "info@pstrack.app",
		SMTP_PASS: "secret",
	},
}))

vi.mock("resend", () => ({
	Resend: class {
		emails = { send: mocks.send }
	},
}))

vi.mock("nodemailer", () => ({
	default: { createTransport: () => ({ sendMail: mocks.sendMail }) },
}))

vi.mock("@react-email/render", () => ({ render: mocks.render }))

vi.mock("@/env", () => ({ env: mocks.env }))

vi.mock("@/server/lib/logger", () => ({
	logger: { debug: mocks.debug, info: mocks.info, error: mocks.error },
}))

import { sendEmail } from "@/server/lib/email"

describe("sendEmail", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.env.EMAIL_TRANSPORT = "log"
	})

	it("logs metadata without contacting Resend when transport is log", async () => {
		const result = await sendEmail({
			from: "PStrack <stage@pstrack.app>",
			to: "person@example.test",
			subject: "Staging message",
			html: "<p>synthetic</p>",
		})

		expect(result).toBeNull()
		expect(mocks.send).not.toHaveBeenCalled()
		expect(mocks.sendMail).not.toHaveBeenCalled()
		expect(mocks.info).toHaveBeenCalledWith(
			{ recipientCount: 1 },
			"email suppressed by log transport"
		)
	})

	it("renders React to HTML/text and sends via SMTP when transport is smtp", async () => {
		mocks.env.EMAIL_TRANSPORT = "smtp"
		mocks.render.mockResolvedValueOnce("<p>hi</p>").mockResolvedValueOnce("hi")
		mocks.sendMail.mockResolvedValueOnce({ messageId: "abc", rejected: [] })

		const result = await sendEmail({
			from: "PStrack <info@pstrack.app>",
			to: "person@example.test",
			subject: "SMTP message",
			react: createElement("div"),
		})

		expect(mocks.send).not.toHaveBeenCalled()
		expect(mocks.sendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				from: "PStrack <info@pstrack.app>",
				to: "person@example.test",
				subject: "SMTP message",
				html: "<p>hi</p>",
				text: "hi",
			})
		)
		expect(result).toEqual({ id: "abc" })
	})

	it("throws when SMTP rejects the recipient", async () => {
		mocks.env.EMAIL_TRANSPORT = "smtp"
		mocks.render.mockResolvedValue("<p>hi</p>")
		mocks.sendMail.mockResolvedValueOnce({
			messageId: "x",
			rejected: ["bad@example.test"],
		})

		await expect(
			sendEmail({
				from: "PStrack <info@pstrack.app>",
				to: "bad@example.test",
				subject: "SMTP message",
				react: createElement("div"),
			})
		).rejects.toThrow("SMTP rejected: bad@example.test")
	})
})
