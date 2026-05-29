import { Elysia, status } from "elysia"

import { isAuthenticated, isPlatformAdmin } from "@/server/lib/session"
import { problemsDao } from "./problems.dao"
import { problemsModel } from "./problems.model"

export const problemsController = new Elysia({ tags: ["Problems"] })
	.use(problemsModel)
	.use(isAuthenticated)
	.get("/problems/today", async ({ user }) => {
		return problemsDao.getTodayForUser(user.id)
	})
	.get(
		"/problems/roadmap",
		async ({ user, query }) => {
			return problemsDao.getRoadmapForUser(user.id, query.roadmap ?? "NC250")
		},
		{ query: "problems.roadmapQuery" }
	)
	.post("/problems/today/solve", async ({ user }) => {
		const result = await problemsDao.markTodaySolved(user.id)
		if (result.error === "NO_GROUP") return status(409, { error: "Join a group first." })
		if (result.error === "NO_PROBLEMS") {
			return status(409, { error: "Seed problems before solving." })
		}
		if (result.error === "PAUSED")
			return status(409, { error: "Today is already paused." })

		return result.today
	})
	.post("/problems/today/pause", async ({ user }) => {
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
	.group("/admin", (app) =>
		app.use(isPlatformAdmin).post(
			"/problems/seed",
			async () => {
				return problemsDao.seedStarterProblems()
			},
			{ detail: { tags: ["Admin"] } }
		)
	)
