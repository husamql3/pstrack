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
		expect(mocks.debug).toHaveBeenCalledWith({ recipientCount: 1 }, "smtp send ok")
		expect(JSON.stringify(mocks.debug.mock.calls)).not.toContain("person@example.test")
		expect(JSON.stringify(mocks.debug.mock.calls)).not.toContain("SMTP message")
		expect(JSON.stringify(mocks.debug.mock.calls)).not.toContain("abc")
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
		).rejects.toThrow("SMTP rejected 1 recipient")
		expect(mocks.error).toHaveBeenCalledWith(
			{ rejectedCount: 1, recipientCount: 1 },
			"smtp send rejected"
		)
		expect(JSON.stringify(mocks.error.mock.calls)).not.toContain("bad@example.test")
		expect(JSON.stringify(mocks.error.mock.calls)).not.toContain("SMTP message")
	})

	it("redacts errors thrown by the SMTP transport", async () => {
		mocks.env.EMAIL_TRANSPORT = "smtp"
		mocks.render.mockResolvedValue("<p>private body sentinel</p>")
		mocks.sendMail.mockRejectedValueOnce(
			new Error(
				"SMTP failure recipient-sentinel sender-sentinel subject-sentinel provider-id-sentinel"
			)
		)

		await expect(
			sendEmail({
				from: "sender-sentinel@example.test",
				to: "recipient-sentinel@example.test",
				subject: "subject-sentinel",
				html: "private body sentinel",
			})
		).rejects.toThrow("SMTP send failed")
		expect(mocks.error).toHaveBeenCalledWith({ recipientCount: 1 }, "smtp send failed")
		const logged = JSON.stringify(mocks.error.mock.calls)
		expect(logged).not.toContain("sentinel")
		expect(logged).not.toContain("private body")
	})

	it("redacts errors thrown while rendering SMTP templates", async () => {
		mocks.env.EMAIL_TRANSPORT = "smtp"
		mocks.render.mockRejectedValueOnce(
			new Error(
				"Render failure recipient-sentinel token-sentinel subject-sentinel body-sentinel"
			)
		)

		await expect(
			sendEmail({
				from: "sender-sentinel@example.test",
				to: "recipient-sentinel@example.test",
				subject: "subject-sentinel",
				react: createElement("div"),
			})
		).rejects.toThrow("SMTP send failed")
		expect(mocks.error).toHaveBeenCalledWith({ recipientCount: 1 }, "smtp send failed")
		expect(JSON.stringify(mocks.error.mock.calls)).not.toContain("sentinel")
		expect(mocks.sendMail).not.toHaveBeenCalled()
	})

	it("redacts recipient content from Resend logs and errors", async () => {
		mocks.env.EMAIL_TRANSPORT = "resend"
		mocks.send.mockResolvedValueOnce({
			data: null,
			error: {
				name: "validation_error",
				message: "Rejected person@example.test for Sensitive subject",
			},
		})

		await expect(
			sendEmail({
				from: "PStrack <info@pstrack.app>",
				to: "person@example.test",
				subject: "Sensitive subject",
				html: "<p>private content</p>",
			})
		).rejects.toThrow("Resend send failed (validation_error)")
		expect(mocks.error).toHaveBeenCalledWith(
			{ errorName: "validation_error", recipientCount: 1 },
			"resend send failed"
		)
		const logged = JSON.stringify(mocks.error.mock.calls)
		expect(logged).not.toContain("person@example.test")
		expect(logged).not.toContain("Sensitive subject")
		expect(logged).not.toContain("private content")
	})

	it("redacts errors thrown by the Resend transport", async () => {
		mocks.env.EMAIL_TRANSPORT = "resend"
		mocks.send.mockRejectedValueOnce(
			new Error(
				"Provider failure recipient-sentinel subject-sentinel token-sentinel provider-id-sentinel"
			)
		)

		await expect(
			sendEmail({
				from: "sender-sentinel@example.test",
				to: "recipient-sentinel@example.test",
				subject: "subject-sentinel",
				html: "token-sentinel",
			})
		).rejects.toThrow("Resend send failed")
		expect(mocks.error).toHaveBeenCalledWith({ recipientCount: 1 }, "resend send failed")
		expect(JSON.stringify(mocks.error.mock.calls)).not.toContain("sentinel")
	})

	it("redacts recipient content from successful Resend logs", async () => {
		mocks.env.EMAIL_TRANSPORT = "resend"
		mocks.send.mockResolvedValueOnce({ data: { id: "provider-message-id" }, error: null })

		const result = await sendEmail({
			from: "PStrack <info@pstrack.app>",
			to: ["one@example.test", "two@example.test"],
			subject: "Sensitive subject",
			html: "<p>private content</p>",
		})

		expect(result).toEqual({ id: "provider-message-id" })
		expect(mocks.debug).toHaveBeenCalledWith({ recipientCount: 2 }, "resend send ok")
		const logged = JSON.stringify(mocks.debug.mock.calls)
		expect(logged).not.toContain("example.test")
		expect(logged).not.toContain("Sensitive subject")
		expect(logged).not.toContain("provider-message-id")
	})
})
