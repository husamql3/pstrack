import { Elysia, status } from "elysia"

import { db } from "@/server/lib/db"
import { requireSessionUser } from "@/server/lib/session"
import { problemsDao } from "./problems.dao"
import { problemsModel } from "./problems.model"

const requirePlatformAdmin = async (request: Request) => {
	const { user, response } = await requireSessionUser(request)
	if (!user) return { user: null, response }

	const dbUser = await db.user.findUnique({
		where: { id: user.id },
		select: { role: true },
	})

	if (dbUser?.role !== "admin") {
		return { user: null, response: status(403, { error: "Admin access required" }) }
	}

	return { user, response: null }
}

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
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			return problemsDao.getRoadmapForUser(user.id, query.roadmap ?? "NC250")
		},
		{ query: "problems.roadmapQuery" }
	)
	.post("/problems/today/solve", async ({ request }) => {
		const { user, response } = await requireSessionUser(request)
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

		return result.today
	})
	.post("/problems/today/pause", async ({ request }) => {
		const { user, response } = await requireSessionUser(request)
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
	.post(
		"/admin/problems/seed",
		async ({ request }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response

			return problemsDao.seedStarterProblems()
		},
		{ detail: { tags: ["Admin"] } }
	)
