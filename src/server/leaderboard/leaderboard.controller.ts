import { Elysia, status } from "elysia"

import { getSessionUser, requireSessionUser } from "@/server/lib/session"
import { leaderboardDao } from "./leaderboard.dao"
import { leaderboardModel } from "./leaderboard.model"
import type { LeaderboardPeriod } from "./leaderboard.type"

const DEFAULT_PERIOD: LeaderboardPeriod = "week"

export const leaderboardController = new Elysia({
	prefix: "/leaderboard",
	tags: ["Leaderboard"],
})
	.use(leaderboardModel)
	.get(
		"/global",
		async ({ query }) => {
			const period = (query.period ?? DEFAULT_PERIOD) as LeaderboardPeriod
			return leaderboardDao.getGlobalLeaderboard(period)
		},
		{ query: "leaderboard.query" }
	)
	.get(
		"/groups/:id",
		async ({ params, query, request }) => {
			const user = await getSessionUser(request)

			const period = (query.period ?? DEFAULT_PERIOD) as LeaderboardPeriod
			const result = await leaderboardDao.getGroupLeaderboard(params.id, period)

			if (!result) return status(404, { error: "Group not found." })

			return { ...result, viewerUserId: user?.id ?? null }
		},
		{ params: "leaderboard.groupIdParams", query: "leaderboard.query" }
	)
	.get("/my-groups", async ({ request }) => {
		const { user, response } = await requireSessionUser(request)
		if (!user) return response

		const memberships = await leaderboardDao.getUserGroups(user.id)
		return memberships.map((m) => m.group)
	})
