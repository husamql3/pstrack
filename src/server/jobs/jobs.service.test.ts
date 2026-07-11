import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
	markMissedForDate: vi.fn(),
	logSystemEvent: vi.fn(),
}))

vi.mock("@/env", () => ({
	env: {
		BETTER_AUTH_URL: "https://pstrack.test",
		EMAIL_FROM: "PStrack <test@pstrack.test>",
	},
}))
vi.mock("@/emails/daily-problem", () => ({ default: vi.fn() }))
vi.mock("@/server/groups/groups.dao", () => ({
	groupsDao: { expirePendingRequests: vi.fn() },
}))
vi.mock("@/server/groups/groups.notifications", () => ({
	groupNotifications: { joinExpired: vi.fn() },
}))
vi.mock("@/server/lib/bot", () => ({ notifyAdmin: vi.fn() }))
vi.mock("@/server/lib/db", () => ({ db: {} }))
vi.mock("@/server/lib/email", () => ({ resend: { batch: { send: vi.fn() } } }))
vi.mock("@/server/lib/sentry", () => ({ captureServerException: vi.fn() }))
vi.mock("@/server/problems/problems.dao", () => ({
	problemsDao: {
		markMissedForDate: mocks.markMissedForDate,
	},
}))
vi.mock("@/server/system-events/system-events.dao", () => ({
	systemEventsDao: {
		log: mocks.logSystemEvent,
	},
}))

import { executeJob } from "./jobs.service"

describe("app-owned jobs", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.markMissedForDate.mockResolvedValue({ missed: 2, warned: 1, removed: 0 })
		mocks.logSystemEvent.mockResolvedValue(undefined)
	})

	it("reconciles only the explicitly requested missed day", async () => {
		await expect(
			executeJob("reconcile-mark-missed", new Date("2026-07-10T18:30:00.000Z"))
		).resolves.toEqual({ missed: 2, warned: 1, removed: 0 })

		expect(mocks.markMissedForDate).toHaveBeenCalledTimes(1)
		expect(mocks.markMissedForDate).toHaveBeenCalledWith(
			new Date("2026-07-10T00:00:00.000Z"),
			{ evaluateWarnings: true }
		)
		expect(mocks.logSystemEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				metadata: expect.objectContaining({ reconciliation: true }),
			})
		)
	})
})
