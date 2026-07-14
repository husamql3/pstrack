import DailyProblemEmail from "@/emails/daily-problem"
import { env } from "@/env"
import { ProSource, SolveStatus, SystemEventType } from "@/generated/prisma/enums"
import { groupsDao } from "@/server/groups/groups.dao"
import { groupNotifications } from "@/server/groups/groups.notifications"
import { notifyAdmin } from "@/server/lib/bot"
import { db } from "@/server/lib/db"
import { sendEmail } from "@/server/lib/email"
import { captureServerException } from "@/server/lib/sentry"
import { auditCachedTotals } from "@/server/points/points.reconciliation"
import { problemsDao } from "@/server/problems/problems.dao"
import { systemEventsDao } from "@/server/system-events/system-events.dao"
import type { JobName } from "./jobs.types"

const DAY_MS = 86_400_000
const CATCH_UP_DAYS = 14
const DIGEST_BATCH_SIZE = 100
const SYSTEM_EVENT_RETENTION_DAYS = 90
const JOB_RUN_RETENTION_DAYS = 30

const utcDay = (date: Date) =>
	new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const sendDailyDigest = async (date: Date) => {
	const recipients = await problemsDao.getDailyDigestRecipients(date)
	const dateKey = date.toISOString().slice(0, 10)
	const dashboardUrl = `${env.BETTER_AUTH_URL.replace(/\/$/, "")}/dashboard`

	let batches = 0
	for (let i = 0; i < recipients.length; i += DIGEST_BATCH_SIZE) {
		const batch = recipients.slice(i, i + DIGEST_BATCH_SIZE)
		const batchIndex = i / DIGEST_BATCH_SIZE
		const emails = batch.map((recipient) => ({
			from: env.EMAIL_FROM,
			to: recipient.email,
			subject: `Today's problem: ${recipient.problemTitle}`,
			react: DailyProblemEmail({
				name: recipient.name,
				groupName: `@${recipient.groupSlug}`,
				problemTitle: recipient.problemTitle,
				difficulty: recipient.difficulty,
				topic: recipient.topic,
				problemUrl: `https://leetcode.com/problems/${recipient.problemSlug}/`,
				dashboardUrl,
			}),
		}))

		// Send per-recipient through the configured transport (Resend / SMTP /
		// log). A failed recipient is captured but never fails the batch.
		await Promise.all(
			emails.map((email) =>
				sendEmail(email).catch((err) =>
					captureServerException(err, {
						tag: "email:daily-digest",
						dateKey,
						batchIndex,
						recipientCount: 1,
					})
				)
			)
		)
		batches++
	}

	return { recipients: recipients.length, batches }
}

const assignDailyProblem = async (scheduledAt: Date) => {
	const date = utcDay(scheduledAt)
	const result = await problemsDao.assignDailyProblems(date)
	const delivery = await sendDailyDigest(date)
	const stats = await problemsDao.getDailySolveStats(date)
	await notifyAdmin("digest.daily", {
		date: date.toISOString().slice(0, 10),
		totalSolves: stats.totalSolves,
		activeUsers: stats.activeUsers,
		newUsers: stats.newUsers,
		pausesUsed: stats.pausesUsed,
		handleChanges: stats.handleChanges,
	})
	return { ...result, ...delivery }
}

const markMissed = async (scheduledAt: Date) => {
	const today = utcDay(scheduledAt)
	const yesterday = new Date(today.getTime() - DAY_MS)
	const result = { missed: 0, warned: 0, removed: 0 }

	for (let offset = CATCH_UP_DAYS; offset >= 1; offset--) {
		const day = new Date(today.getTime() - offset * DAY_MS)
		const dayResult = await problemsDao.markMissedForDate(day, {
			evaluateWarnings: day.getTime() === yesterday.getTime(),
		})
		result.missed += dayResult.missed
		result.warned += dayResult.warned
		result.removed += dayResult.removed
	}

	if (result.missed > 0) {
		await systemEventsDao
			.log({
				actorId: null,
				actorUsername: "system",
				actorName: "System",
				eventType: SystemEventType.MISS_BATCH,
				metadata: { count: result.missed, date: yesterday.toISOString() },
			})
			.catch(() => {})
	}
	return result
}

const reconcileMarkMissed = async (targetDate: Date) => {
	const date = utcDay(targetDate)
	const result = await problemsDao.markMissedForDate(date, {
		evaluateWarnings: true,
	})
	if (result.missed > 0) {
		await systemEventsDao
			.log({
				actorId: null,
				actorUsername: "system",
				actorName: "System",
				eventType: SystemEventType.MISS_BATCH,
				metadata: {
					count: result.missed,
					date: date.toISOString(),
					reconciliation: true,
				},
			})
			.catch(() => {})
	}
	return result
}

const expireJoinRequests = async () => {
	const { expired, requests } = await groupsDao.expirePendingRequests()
	await Promise.all(
		requests.map((request) =>
			groupNotifications.joinExpired(request.groupId, request.userId)
		)
	)
	return { expired }
}

const expireAdminProGrants = async () => {
	const expired = await db.user.findMany({
		where: {
			isPro: true,
			proSource: ProSource.ADMIN_GRANT,
			proExpiresAt: { lt: new Date() },
		},
		select: { id: true, username: true },
	})
	if (expired.length === 0) return { expired: 0 }

	await db.user.updateMany({
		where: { id: { in: expired.map((user) => user.id) } },
		data: { isPro: false, proExpiresAt: null, proSource: null },
	})
	await notifyAdmin("pro.expired", {
		count: expired.length,
		username: expired.length === 1 ? (expired[0]?.username ?? undefined) : undefined,
		source: "admin_grant",
		expiredAt: new Date().toISOString(),
	})
	return { expired: expired.length }
}

const purgeSystemEvents = async () => {
	const eventCutoff = new Date(Date.now() - SYSTEM_EVENT_RETENTION_DAYS * DAY_MS)
	const jobRunCutoff = new Date(Date.now() - JOB_RUN_RETENTION_DAYS * DAY_MS)
	const [deleted, jobRunsDeleted] = await Promise.all([
		systemEventsDao.purgeOlderThan(eventCutoff),
		db.jobRun.deleteMany({ where: { createdAt: { lt: jobRunCutoff } } }),
	])
	return { deleted, jobRunsDeleted: jobRunsDeleted.count }
}

const sendWeeklyDigest = async (scheduledAt: Date) => {
	const weekStart = new Date(scheduledAt.getTime() - 7 * DAY_MS)
	const prevStart = new Date(scheduledAt.getTime() - 14 * DAY_MS)
	const [users, proUsers, newUsers, solves, solvesPrev] = await Promise.all([
		db.user.count(),
		db.user.count({ where: { isPro: true } }),
		db.user.count({ where: { createdAt: { gte: weekStart } } }),
		db.userSolve.count({
			where: { status: SolveStatus.SOLVED, createdAt: { gte: weekStart } },
		}),
		db.userSolve.count({
			where: {
				status: SolveStatus.SOLVED,
				createdAt: { gte: prevStart, lt: weekStart },
			},
		}),
	])
	await notifyAdmin("digest.weekly", {
		weekStart: weekStart.toISOString().slice(0, 10),
		weekEnd: scheduledAt.toISOString().slice(0, 10),
		users,
		usersDelta: newUsers,
		solves,
		solvesDelta: solves - solvesPrev,
		proUsers,
		newUsers,
	})
	return { users, solves, newUsers }
}

const reconcilePoints = async () => {
	try {
		const result = await auditCachedTotals()
		if (result.mismatchedUsers > 0) {
			await notifyAdmin("points.reconciliation_drift", {
				checkedUsers: result.checkedUsers,
				mismatchedUsers: result.mismatchedUsers,
				absoluteDrift: result.absoluteDrift,
			})
		}
		return result
	} catch (error) {
		await notifyAdmin("points.reconciliation_failed", {
			occurredAt: new Date().toISOString(),
		})
		throw error
	}
}

const resetTodayProblems = async (scheduledAt: Date) => {
	const date = utcDay(scheduledAt)
	const dailyProblems = await db.dailyProblem.findMany({
		where: { assignedDate: date },
		select: { id: true },
	})
	const ids = dailyProblems.map((problem) => problem.id)
	const [{ count: solvesDeleted }, { count: problemsDeleted }] = await db.$transaction([
		db.userSolve.deleteMany({ where: { dailyProblemId: { in: ids } } }),
		db.dailyProblem.deleteMany({ where: { id: { in: ids } } }),
	])
	return { problemsDeleted, solvesDeleted }
}

export const executeJob = async (
	jobName: JobName,
	scheduledAt: Date
): Promise<Record<string, unknown>> => {
	switch (jobName) {
		case "assign-daily-problem":
			return assignDailyProblem(scheduledAt)
		case "mark-missed":
			return markMissed(scheduledAt)
		case "expire-join-requests":
			return expireJoinRequests()
		case "reset-monthly-counters":
			return problemsDao.resetMonthlyCounters()
		case "expire-admin-pro-grants":
			return expireAdminProGrants()
		case "purge-system-events":
			return purgeSystemEvents()
		case "send-weekly-digest":
			return sendWeeklyDigest(scheduledAt)
		case "reconcile-points":
			return reconcilePoints()
		case "reset-today-problems":
			return resetTodayProblems(scheduledAt)
		case "reconcile-mark-missed":
			return reconcileMarkMissed(scheduledAt)
	}
}
