// @ts-nocheck
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/server/lib/db", () => ({
	db: {
		systemEventLog: { create: vi.fn(), deleteMany: vi.fn() },
		group: { findUnique: vi.fn() },
	},
}))

vi.mock("@/server/lib/bot", () => ({
	notifyAdmin: vi.fn(),
}))

import { notifyAdmin } from "@/server/lib/bot"
import { db } from "@/server/lib/db"
import { systemEventsDao } from "./system-events.dao"

describe("systemEventsDao.log — bot forwarding (AgDR-0001)", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		db.systemEventLog.create.mockResolvedValue({})
		db.group.findUnique.mockResolvedValue({ slug: "daily-grind" })
	})

	it("always writes the event row", async () => {
		await systemEventsDao.log({ eventType: "SOLVE_VERIFIED" })
		expect(db.systemEventLog.create).toHaveBeenCalledTimes(1)
	})

	it("forwards realtime-classed events as system.event with a resolved group label", async () => {
		await systemEventsDao.log({
			eventType: "GROUP_LEFT",
			actorName: "Sara",
			actorUsername: "sara",
			targetType: "GROUP",
			targetId: "grp_1",
		})
		expect(notifyAdmin).toHaveBeenCalledTimes(1)
		const [event, payload] = notifyAdmin.mock.calls[0]
		expect(event).toBe("system.event")
		expect(payload.type).toBe("GROUP_LEFT")
		expect(payload.actorUsername).toBe("sara")
		expect(payload.targetLabel).toBe("@daily-grind")
	})

	it("does NOT forward low-signal events (solve firehose stays out of realtime)", async () => {
		await systemEventsDao.log({ eventType: "SOLVE_VERIFIED" })
		await systemEventsDao.log({ eventType: "MISS_BATCH" })
		await systemEventsDao.log({ eventType: "PAUSE_USED" })
		expect(notifyAdmin).not.toHaveBeenCalled()
	})

	it("does NOT forward JOIN_REQUEST_SENT (it has a dedicated buttoned emit)", async () => {
		await systemEventsDao.log({ eventType: "JOIN_REQUEST_SENT" })
		expect(notifyAdmin).not.toHaveBeenCalled()
	})

	it("does NOT notify the admin after a join request is approved", async () => {
		await systemEventsDao.log({ eventType: "JOIN_REQUEST_APPROVED" })
		expect(notifyAdmin).not.toHaveBeenCalled()
	})
})
