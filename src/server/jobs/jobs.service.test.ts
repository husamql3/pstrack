import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
	markMissedForDate: vi.fn(),
	logSystemEvent: vi.fn(),
	auditCachedTotals: vi.fn(),
	notifyAdmin: vi.fn(),
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
vi.mock("@/server/lib/bot", () => ({ notifyAdmin: mocks.notifyAdmin }))
vi.mock("@/server/lib/db", () => ({ db: {} }))
vi.mock("@/server/lib/email", () => ({ resend: { batch: { send: vi.fn() } } }))
vi.mock("@/server/lib/sentry", () => ({ captureServerException: vi.fn() }))
vi.mock("@/server/points/points.reconciliation", () => ({
	auditCachedTotals: mocks.auditCachedTotals,
}))
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
		mocks.notifyAdmin.mockResolvedValue(undefined)
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

	it("checks point-cache drift without applying it and sends only aggregate evidence", async () => {
		const result = {
			checkedUsers: 14,
			mismatchedUsers: 2,
			absoluteDrift: 8,
			correctedUsers: 0,
			proGranted: 0,
		}
		mocks.auditCachedTotals.mockResolvedValue(result)

		await expect(
			executeJob("reconcile-points", new Date("2026-07-12T00:30:00.000Z"))
		).resolves.toEqual(result)

		expect(mocks.auditCachedTotals).toHaveBeenCalledOnce()
		expect(mocks.notifyAdmin).toHaveBeenCalledWith("points.reconciliation_drift", {
			checkedUsers: 14,
			mismatchedUsers: 2,
			absoluteDrift: 8,
		})
	})

	it("does not send a reconciliation alert when every cached total is valid", async () => {
		mocks.auditCachedTotals.mockResolvedValue({
			checkedUsers: 14,
			mismatchedUsers: 0,
			absoluteDrift: 0,
			correctedUsers: 0,
			proGranted: 0,
		})

		await executeJob("reconcile-points", new Date("2026-07-12T00:30:00.000Z"))

		expect(mocks.notifyAdmin).not.toHaveBeenCalled()
	})

	it("sends a sanitized alert when the reconciliation check fails", async () => {
		mocks.auditCachedTotals.mockRejectedValue(new Error("database detail"))

		await expect(
			executeJob("reconcile-points", new Date("2026-07-12T00:30:00.000Z"))
		).rejects.toThrow("database detail")

		expect(mocks.notifyAdmin).toHaveBeenCalledWith("points.reconciliation_failed", {
			occurredAt: expect.any(String),
		})
	})
})
