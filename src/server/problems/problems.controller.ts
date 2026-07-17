import { Elysia, status } from "elysia"

import { SystemEventTargetType, SystemEventType } from "@/generated/prisma/enums"
import { axiomLog } from "@/server/lib/axiom"
import {
	getSessionUser,
	requireRealSession,
	requireSessionUser,
} from "@/server/lib/session"
import { systemEventsDao } from "@/server/system-events/system-events.dao"
import { problemsDao } from "./problems.dao"
import { problemsModel } from "./problems.model"
import { problemNotifications } from "./problems.notifications"

export const problemsController = new Elysia({ tags: ["Problems"] })
	.use(problemsModel)
	.get("/problems/today", async ({ request }) => {
		const { user, response } = await requireSessionUser(request)
		if (!user) return response

		return problemsDao.listTodayForUser(user.id)
	})
	.get(
		"/problems/roadmap",
		async ({ request, query }) => {
			const user = await getSessionUser(request)
			return problemsDao.getRoadmapForUser(user?.id ?? null, query.roadmap ?? "NC250")
		},
		{ query: "problems.roadmapQuery" }
	)
	.post(
		"/problems/today/solve",
		async ({ request, body }) => {
			const { user, response } = await requireRealSession(request)
			if (!user) return response

			const sessionId = request.headers.get("x-session-id")
			axiomLog("solve_attempted", { userId: user.id, sessionId, groupId: body.groupId })

			const result = await problemsDao.verifyAndMarkSolved(user.id, body.groupId)
			if (result.error === "NO_GROUP")
				return status(409, { error: "Join a group first." })
			if (result.error === "NO_PROBLEMS")
				return status(409, { error: "Seed problems before solving." })
			if (result.error === "PAUSED")
				return status(409, { error: "Today is already paused." })
			if (result.error === "PREMIUM_SKIPPED") {
				return status(409, {
					error: "Premium problems are skipped until PStrack Judge is available.",
				})
			}
			if (result.error === "NOT_VERIFIED") {
				axiomLog("verification_failed", {
					userId: user.id,
					sessionId,
					reason: "NOT_VERIFIED",
				})
				return status(409, {
					error: "No accepted submission found on LeetCode for today's problem.",
				})
			}
			if (result.error !== null) return result.today

			axiomLog("verification_succeeded", {
				userId: user.id,
				sessionId,
				newStreak: result.newStreak,
				crossedProThreshold: result.crossedProThreshold,
				newBadges: result.newBadges,
			})

			systemEventsDao
				.log({
					actorId: user.id,
					actorUsername: user.username ?? undefined,
					actorName: user.name,
					eventType: SystemEventType.SOLVE_VERIFIED,
					targetType: SystemEventTargetType.USER,
					targetId: user.id,
					metadata: { newStreak: result.newStreak },
				})
				.catch(() => {})

			problemNotifications
				.sendSolveAchievementEmails(user.id, user.email, user.name, {
					crossedProThreshold: result.crossedProThreshold,
					newBadges: result.newBadges,
					newStreak: result.newStreak,
				})
				.catch(() => {})

			return { today: result.today, newBadges: result.newBadges }
		},
		{ body: "problems.solveBody" }
	)
	.post("/problems/today/pause", async ({ request }) => {
		const { user, response } = await requireRealSession(request)
		if (!user) return response

		const result = await problemsDao.pauseToday(user.id)
		if (result.error === "NO_GROUP") return status(409, { error: "Join a group first." })
		if (result.error === "NO_PAUSES") {
			return status(403, { error: "You have no pauses remaining this month." })
		}
		if (result.error === "ALREADY_STARTED") {
			return status(409, { error: "You already solved a problem today." })
		}
		// NOTHING_TO_PAUSE is benign (already paused / nothing open) — return the list.
		if (result.error !== null && result.error !== "NOTHING_TO_PAUSE") {
			return result.todays
		}

		if (result.error === null) {
			systemEventsDao
				.log({
					actorId: user.id,
					actorUsername: user.username ?? undefined,
					actorName: user.name,
					eventType: SystemEventType.PAUSE_USED,
					targetType: SystemEventTargetType.USER,
					targetId: user.id,
				})
				.catch(() => {})
		}
		return result.todays
	})
