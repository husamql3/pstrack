// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@trigger.dev/sdk/v3", () => ({
	logger: { log: vi.fn() },
	schedules: {
		task: vi.fn((config) => config),
	},
	task: vi.fn((config) => config),
}))

vi.mock("@/env", () => ({
	env: {
		BETTER_AUTH_URL: "https://pstrack.localhost/",
		EMAIL_FROM: "PStrack <daily@pstrack.localhost>",
	},
}))

vi.mock("@/emails/daily-problem", () => ({
	default: vi.fn((props) => ({ type: "DailyProblemEmail", props })),
}))

vi.mock("@/server/lib/db", () => ({
	db: {
		$transaction: vi.fn(),
		dailyProblem: {
			deleteMany: vi.fn(),
			findMany: vi.fn(),
		},
		user: {
			findMany: vi.fn(),
			updateMany: vi.fn(),
		},
		userSolve: {
			deleteMany: vi.fn(),
		},
	},
}))

vi.mock("@/server/lib/email", () => ({
	resend: {
		batch: {
			send: vi.fn(),
		},
	},
}))

vi.mock("@/server/lib/sentry", () => ({
	captureServerException: vi.fn(),
}))

vi.mock("@/server/groups/groups.dao", () => ({
	groupsDao: {
		expirePendingRequests: vi.fn(),
	},
}))

vi.mock("@/server/groups/groups.notifications", () => ({
	groupNotifications: {
		joinExpired: vi.fn(),
	},
}))

vi.mock("@/server/problems/problems.dao", () => ({
	problemsDao: {
		assignDailyProblems: vi.fn(),
		getDailyDigestRecipients: vi.fn(),
		getDailySolveStats: vi.fn(),
		markMissedForDate: vi.fn(),
		resetMonthlyCounters: vi.fn(),
	},
}))

vi.mock("@/server/lib/bot", () => ({
	notifyAdmin: vi.fn(),
}))

import { ProSource } from "@/generated/prisma/enums"
import { groupsDao } from "@/server/groups/groups.dao"
import { groupNotifications } from "@/server/groups/groups.notifications"
import { db } from "@/server/lib/db"
import { resend } from "@/server/lib/email"
import { captureServerException } from "@/server/lib/sentry"
import { problemsDao } from "@/server/problems/problems.dao"
import { assignDailyProblemTask } from "./assign-daily-problem"
import { expireAdminProGrantsTask } from "./expire-admin-pro-grants"
import { expireJoinRequestsTask } from "./expire-join-requests"
import { markMissedTask } from "./mark-missed"
import { resetMonthlyCountersTask } from "./reset-monthly-counters"
import { resetTodayProblemsTask } from "./reset-today-problems"
import { sendDailyDigestBatchTask } from "./send-daily-digest-batch"

describe("trigger tasks", () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date("2026-06-16T12:00:00.000Z"))
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.clearAllMocks()
	})

	it("assigns daily problems for the UTC day and batches daily digest recipients", async () => {
		const recipients = Array.from({ length: 101 }, (_, i) => ({
			email: `user-${i}@example.com`,
			name: `User ${i}`,
			groupSlug: "alpha",
			problemSlug: "two-sum",
			problemTitle: "Two Sum",
			difficulty: "EASY",
			topic: "Arrays",
		}))
		problemsDao.assignDailyProblems.mockResolvedValue({
			total: 3,
			assigned: 2,
			skipped: 1,
		})
		problemsDao.getDailyDigestRecipients.mockResolvedValue(recipients)
		problemsDao.getDailySolveStats.mockResolvedValue({
			totalSolves: 0,
			activeUsers: 0,
			newUsers: 0,
		})
		sendDailyDigestBatchTask.batchTrigger = vi.fn()

		const result = await assignDailyProblemTask.run({
			timestamp: new Date("2026-06-16T22:45:00.000Z"),
		})

		expect(problemsDao.assignDailyProblems).toHaveBeenCalledWith(
			new Date("2026-06-16T00:00:00.000Z")
		)
		expect(sendDailyDigestBatchTask.batchTrigger).toHaveBeenCalledWith([
			{
				payload: {
					recipients: recipients.slice(0, 100),
					dateKey: "2026-06-16",
					batchIndex: 0,
				},
				options: { idempotencyKey: "daily-digest:2026-06-16:0" },
			},
			{
				payload: {
					recipients: recipients.slice(100),
					dateKey: "2026-06-16",
					batchIndex: 1,
				},
				options: { idempotencyKey: "daily-digest:2026-06-16:1" },
			},
		])
		expect(result).toEqual({
			total: 3,
			assigned: 2,
			skipped: 1,
			recipients: 101,
			batches: 2,
		})
	})

	it("backfills missed solves and evaluates warnings for the previous UTC day", async () => {
		problemsDao.markMissedForDate.mockImplementation(async (date, opts) => {
			if (date.toISOString() === "2026-06-02T00:00:00.000Z") {
				return { missed: 2, warned: 0, removed: 0 }
			}
			if (date.toISOString() === "2026-06-15T00:00:00.000Z") {
				return {
					missed: 1,
					warned: opts.evaluateWarnings ? 1 : 0,
					removed: 0,
				}
			}
			return { missed: 0, warned: 0, removed: 0 }
		})

		const result = await markMissedTask.run({
			timestamp: new Date("2026-06-16T00:00:00.000Z"),
		})

		expect(problemsDao.markMissedForDate).toHaveBeenCalledTimes(14)
		expect(problemsDao.markMissedForDate).toHaveBeenNthCalledWith(
			1,
			new Date("2026-06-02T00:00:00.000Z"),
			{ evaluateWarnings: false }
		)
		expect(problemsDao.markMissedForDate).toHaveBeenNthCalledWith(
			14,
			new Date("2026-06-15T00:00:00.000Z"),
			{ evaluateWarnings: true }
		)
		expect(result).toEqual({ missed: 3, warned: 1, removed: 0 })
	})

	it("expires join requests and notifies affected users", async () => {
		groupsDao.expirePendingRequests.mockResolvedValue({
			expired: 2,
			requests: [
				{ groupId: "group-1", userId: "user-1" },
				{ groupId: "group-2", userId: "user-2" },
			],
		})

		const result = await expireJoinRequestsTask.run()

		expect(groupNotifications.joinExpired).toHaveBeenCalledWith("group-1", "user-1")
		expect(groupNotifications.joinExpired).toHaveBeenCalledWith("group-2", "user-2")
		expect(result).toEqual({ expired: 2 })
	})

	it("resets monthly counters through the problems DAO", async () => {
		problemsDao.resetMonthlyCounters.mockResolvedValue({ reset: 5 })

		await expect(resetMonthlyCountersTask.run()).resolves.toEqual({ reset: 5 })
	})

	it("expires admin-granted Pro access when its end date has passed", async () => {
		db.user.findMany.mockResolvedValue([
			{ id: "user-1", username: "alice" },
			{ id: "user-2", username: null },
		])

		const result = await expireAdminProGrantsTask.run()

		expect(db.user.findMany).toHaveBeenCalledWith({
			where: {
				isPro: true,
				proSource: ProSource.ADMIN_GRANT,
				proExpiresAt: { lt: new Date("2026-06-16T12:00:00.000Z") },
			},
			select: { id: true, username: true },
		})
		expect(db.user.updateMany).toHaveBeenCalledWith({
			where: { id: { in: ["user-1", "user-2"] } },
			data: { isPro: false, proExpiresAt: null, proSource: null },
		})
		expect(result).toEqual({ expired: 2 })
	})

	it("deletes today's daily problems and their solves", async () => {
		db.dailyProblem.findMany.mockResolvedValue([{ id: "daily-1" }, { id: "daily-2" }])
		db.userSolve.deleteMany.mockReturnValue({ kind: "delete-solves" })
		db.dailyProblem.deleteMany.mockReturnValue({ kind: "delete-daily" })
		db.$transaction.mockResolvedValue([{ count: 3 }, { count: 2 }])

		const result = await resetTodayProblemsTask.run()

		expect(db.dailyProblem.findMany).toHaveBeenCalledWith({
			where: { assignedDate: new Date("2026-06-16T00:00:00.000Z") },
			select: { id: true },
		})
		expect(db.userSolve.deleteMany).toHaveBeenCalledWith({
			where: { dailyProblemId: { in: ["daily-1", "daily-2"] } },
		})
		expect(db.dailyProblem.deleteMany).toHaveBeenCalledWith({
			where: { id: { in: ["daily-1", "daily-2"] } },
		})
		expect(result).toEqual({ solvesDeleted: 3, problemsDeleted: 2 })
	})

	it("sends daily digest emails and reports per-recipient failures", async () => {
		resend.batch.send.mockResolvedValue({
			data: {
				data: [{ id: "email-1" }, { error: new Error("bad recipient") }],
			},
			error: null,
		})

		const result = await sendDailyDigestBatchTask.run({
			dateKey: "2026-06-16",
			batchIndex: 0,
			recipients: [
				{
					email: "alice@example.com",
					name: "Alice",
					groupSlug: "alpha",
					problemSlug: "two-sum",
					problemTitle: "Two Sum",
					difficulty: "EASY",
					topic: "Arrays",
				},
				{
					email: "bob@example.com",
					name: "Bob",
					groupSlug: "alpha",
					problemSlug: "two-sum",
					problemTitle: "Two Sum",
					difficulty: "EASY",
					topic: "Arrays",
				},
			],
		})

		expect(resend.batch.send).toHaveBeenCalledWith(
			[
				expect.objectContaining({
					from: "PStrack <daily@pstrack.localhost>",
					to: "alice@example.com",
					subject: "Today's problem: Two Sum",
				}),
				expect.objectContaining({
					to: "bob@example.com",
				}),
			],
			{ idempotencyKey: "daily-digest:2026-06-16:0" }
		)
		expect(captureServerException).toHaveBeenCalledWith(expect.any(Error), {
			tag: "email:daily-digest",
			email: "bob@example.com",
			dateKey: "2026-06-16",
			batchIndex: 0,
		})
		expect(result).toEqual({ sent: 1, failed: 1 })
	})
})
