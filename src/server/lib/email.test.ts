import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
	send: vi.fn(),
	debug: vi.fn(),
	info: vi.fn(),
}))

vi.mock("resend", () => ({
	Resend: class {
		emails = { send: mocks.send }
	},
}))

vi.mock("@/env", () => ({
	env: {
		EMAIL_TRANSPORT: "log",
		RESEND_API_KEY: "unused-in-log-mode",
	},
}))

vi.mock("@/server/lib/logger", () => ({
	logger: { debug: mocks.debug, info: mocks.info },
}))

import { sendEmail } from "@/server/lib/email"

describe("sendEmail", () => {
	beforeEach(() => vi.clearAllMocks())

	it("logs metadata without contacting Resend when transport is log", async () => {
		const result = await sendEmail({
			from: "PStrack <stage@pstrack.app>",
			to: "person@example.test",
			subject: "Staging message",
			html: "<p>synthetic</p>",
		})

		expect(result).toBeNull()
		expect(mocks.send).not.toHaveBeenCalled()
		expect(mocks.info).toHaveBeenCalledWith(
			{ recipientCount: 1 },
			"email suppressed by log transport"
		)
	})
})
