import { Elysia, status } from "elysia"

import {
	getSessionUser,
	requireRealSession,
	requireSessionUser,
} from "@/server/lib/session"
import { problemsDao } from "./problems.dao"
import { problemsModel } from "./problems.model"
import { problemNotifications } from "./problems.notifications"

export const problemsController = new Elysia({ tags: ["Problems"] })
	.use(problemsModel)
	.get("/problems/today", async ({ request }) => {
		const { user, response } = await requireSessionUser(request)
		if (!user) return response

		return problemsDao.getTodayForUser(user.id)
	})
	.get(
		"/problems/roadmap",
		async ({ request, query }) => {
			const user = await getSessionUser(request)
			return problemsDao.getRoadmapForUser(user?.id ?? null, query.roadmap ?? "NC250")
		},
		{ query: "problems.roadmapQuery" }
	)
	.post("/problems/today/solve", async ({ request }) => {
		const { user, response } = await requireRealSession(request)
		if (!user) return response

		const result = await problemsDao.verifyAndMarkSolved(user.id)
		if (result.error === "NO_GROUP") return status(409, { error: "Join a group first." })
		if (result.error === "NO_PROBLEMS")
			return status(409, { error: "Seed problems before solving." })
		if (result.error === "PAUSED")
			return status(409, { error: "Today is already paused." })
		if (result.error === "NOT_VERIFIED") {
			return status(409, {
				error: "No accepted submission found on LeetCode for today's problem.",
			})
		}
		if (result.error === "VERIFICATION_FAILED_PENALIZED") {
			return status(409, {
				error: "Solve not found on LeetCode. Streak broken and points deducted.",
			})
		}

		if (result.error !== null) return result.today

		problemNotifications
			.sendSolveAchievementEmails(user.id, user.email, user.name, {
				crossedProThreshold: result.crossedProThreshold,
				newBadges: result.newBadges,
				newStreak: result.newStreak,
			})
			.catch(() => {})

		return { today: result.today, newBadges: result.newBadges }
	})
	.post("/problems/today/pause", async ({ request }) => {
		const { user, response } = await requireRealSession(request)
		if (!user) return response

		const result = await problemsDao.pauseToday(user.id)
		if (result.error === "NO_GROUP") return status(409, { error: "Join a group first." })
		if (result.error === "NO_PROBLEMS") {
			return status(409, { error: "Seed problems before pausing." })
		}
		if (result.error === "NO_PAUSES") {
			return status(403, { error: "You have no pauses remaining this month." })
		}
		if (result.error === "ALREADY_STARTED") {
			return status(409, { error: "You already started today's problem." })
		}

		return result.today
	})
