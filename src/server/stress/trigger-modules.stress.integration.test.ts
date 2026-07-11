import { beforeEach, describe, expect, it, vi } from "vitest"

const deliveryMocks = vi.hoisted(() => ({
	notifyAdmin: vi.fn(async (_event: string, _payload: unknown) => {}),
	resendBatchSend: vi.fn(
		async (emails: unknown[], _options?: { idempotencyKey: string }) => ({
			data: { data: emails.map(() => ({ id: "stress-email" })) },
			error: null,
		})
	),
}))

vi.mock("@trigger.dev/sdk/v3", () => ({
	logger: { log: vi.fn() },
	schedules: {
		task: vi.fn((config) => config),
	},
	task: vi.fn((config) => config),
}))

vi.mock("@/server/lib/bot", () => ({
	notifyAdmin: deliveryMocks.notifyAdmin,
}))

vi.mock("@/server/lib/email", () => ({
	resend: {
		batch: {
			send: deliveryMocks.resendBatchSend,
		},
	},
	sendEmail: vi.fn(async () => ({ id: "stress-email" })),
}))

vi.mock("@/server/lib/redis", () => ({
	createRedisKey: (...parts: string[]) => parts.join(":"),
	redisExpire: vi.fn(async () => {}),
	redisSAdd: vi.fn(async () => {}),
	redisSIsMember: vi.fn(async () => false),
}))

vi.mock("@/server/lib/sentry", () => ({
	captureServerException: vi.fn(),
}))

import { ProSource } from "@/generated/prisma/enums"
import { assignDailyProblemTask } from "@/server/trigger/assign-daily-problem"
import { expireAdminProGrantsTask } from "@/server/trigger/expire-admin-pro-grants"
import { expireJoinRequestsTask } from "@/server/trigger/expire-join-requests"
import { markMissedTask } from "@/server/trigger/mark-missed"
import { purgeSystemEventsTask } from "@/server/trigger/purge-system-events"
import { resetMonthlyCountersTask } from "@/server/trigger/reset-monthly-counters"
import { resetTodayProblemsTask } from "@/server/trigger/reset-today-problems"
import { sendDailyDigestBatchTask } from "@/server/trigger/send-daily-digest-batch"
import { sendWeeklyDigestTask } from "@/server/trigger/send-weekly-digest"
import {
	addMember,
	addRoadmapProblem,
	createDailyProblem,
	createGroup,
	createProblem,
	createUser,
	testDb,
} from "@/test/db"
import {
	expectCoreStressInvariants,
	expectNoRejectedStressWork,
	runConcurrent,
	stressRepetitions,
	withStressRetry,
} from "@/test/stress"

const startOfUtcDay = (date: Date) =>
	new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const runStressTask = async (
	taskDefinition: object,
	payload?: unknown
): Promise<unknown> => {
	const run: unknown = Reflect.get(taskDefinition, "run")
	if (typeof run !== "function")
		throw new Error("Stress task is missing its run function")

	return Reflect.apply(run, taskDefinition, payload === undefined ? [] : [payload])
}

const seedTriggerState = async () => {
	const today = startOfUtcDay(new Date())
	const yesterday = new Date(today.getTime() - 86_400_000)
	const tomorrow = new Date(today.getTime() + 86_400_000)

	const admin = await createUser({
		id: "stress-trigger-admin",
		email: "stress-trigger-admin@example.com",
		username: "stress_trigger_admin",
		role: "admin",
		isPro: true,
	})
	const user = await createUser({
		id: "stress-trigger-user",
		email: "stress-trigger-user@example.com",
		username: "stress_trigger_user",
		pausesUsedThisMonth: 2,
		verificationFailuresThisMonth: 3,
		currentStreak: 4,
		currentStreakStartedAt: new Date(yesterday.getTime() - 3 * 86_400_000),
	})
	const expiredPro = await createUser({
		id: "stress-expired-pro",
		email: "stress-expired-pro@example.com",
		username: "stress_expired_pro",
		isPro: true,
		proSource: ProSource.ADMIN_GRANT,
	})
	await testDb.user.update({
		where: { id: expiredPro.id },
		data: { proExpiresAt: new Date(Date.now() - 60_000) },
	})
	const requester = await createUser({
		id: "stress-trigger-requester",
		email: "stress-trigger-requester@example.com",
		username: "stress_trigger_requester",
	})

	const group = await createGroup({
		id: "stress-trigger-group",
		slug: "stress-trigger-group",
		creatorId: admin.id,
		maxMembers: 50,
		isStarted: true,
	})
	await addMember(group.id, user.id)
	await testDb.groupMember.updateMany({
		where: { groupId: group.id, userId: user.id },
		data: { joinedAt: new Date(yesterday.getTime() - 86_400_000) },
	})

	const problem = await createProblem({
		id: "stress-trigger-problem",
		slug: "stress-trigger-problem",
		title: "Stress Trigger Problem",
		roadmapIndex: 20_001,
	})
	await addRoadmapProblem({ problemId: problem.id, position: 1, topic: problem.topic })
	await createDailyProblem({
		groupId: group.id,
		problemId: problem.id,
		assignedDate: yesterday,
	})

	await testDb.groupJoinRequest.create({
		data: {
			groupId: group.id,
			userId: requester.id,
			status: "PENDING",
			expiresAt: new Date(Date.now() - 60_000),
		},
	})

	await testDb.systemEventLog.create({
		data: {
			eventType: "GROUP_JOINED",
			targetType: "GROUP",
			targetId: group.id,
			createdAt: new Date(Date.now() - 100 * 86_400_000),
		},
	})

	return { today, tomorrow, groupId: group.id }
}

describe("Trigger module stress suite", () => {
	beforeEach(() => {
		deliveryMocks.notifyAdmin.mockClear()
		deliveryMocks.resendBatchSend.mockClear()
		Reflect.set(
			sendDailyDigestBatchTask,
			"batchTrigger",
			vi.fn(async () => ({ batchId: "stress-digest-batch" }))
		)
	})

	it("keeps scheduled modules idempotent under repeated runs", async () => {
		const state = await seedTriggerState()
		const repetitions = stressRepetitions(2)
		const tasks = [
			() => runStressTask(assignDailyProblemTask, { timestamp: state.today }),
			() => runStressTask(markMissedTask, { timestamp: state.tomorrow }),
			() => runStressTask(expireJoinRequestsTask),
			() => runStressTask(resetMonthlyCountersTask),
			() => runStressTask(expireAdminProGrantsTask),
			() => runStressTask(purgeSystemEventsTask),
			() => runStressTask(sendWeeklyDigestTask),
		]
		const work = tasks.flatMap((task) => Array.from({ length: repetitions }, () => task))

		const results = await runConcurrent(work.length, async (index) =>
			withStressRetry(() => work[index]())
		)

		expectNoRejectedStressWork(results)
		await expectCoreStressInvariants()
		const weeklyNotifications = deliveryMocks.notifyAdmin.mock.calls.filter(
			([event]) => event === "digest.weekly"
		)
		expect(weeklyNotifications).toHaveLength(repetitions)
	}, 20_000)

	it("keeps destructive and delivery modules bounded under repeated runs", async () => {
		await seedTriggerState()
		const repetitions = stressRepetitions(2)
		const digestPayload = {
			dateKey: "2026-06-16",
			batchIndex: 0,
			recipients: [
				{
					email: "stress-trigger-user@example.com",
					name: "Stress Trigger User",
					groupSlug: "stress-trigger-group",
					problemSlug: "stress-trigger-problem",
					problemTitle: "Stress Trigger Problem",
					difficulty: "EASY",
					topic: "Stress",
				},
			],
		}
		const tasks = [
			() => runStressTask(resetTodayProblemsTask),
			() => runStressTask(sendDailyDigestBatchTask, digestPayload),
		]
		const work = tasks.flatMap((task) => Array.from({ length: repetitions }, () => task))

		const results = await runConcurrent(work.length, async (index) =>
			withStressRetry(() => work[index]())
		)

		expectNoRejectedStressWork(results)
		await expectCoreStressInvariants()
		expect(deliveryMocks.resendBatchSend).toHaveBeenCalledTimes(repetitions)
		for (const [, options] of deliveryMocks.resendBatchSend.mock.calls) {
			expect(options).toEqual({
				idempotencyKey: "daily-digest:2026-06-16:0",
			})
		}
	}, 20_000)
})
