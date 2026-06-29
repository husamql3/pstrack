import Elysia, { t } from "elysia"

const periodSchema = t.Union([
	t.Literal("week"),
	t.Literal("month"),
	t.Literal("alltime"),
])

export const leaderboardModel = new Elysia({ name: "model/leaderboard" }).model({
	"leaderboard.query": t.Object({
		period: t.Optional(periodSchema),
	}),
	"leaderboard.groupIdParams": t.Object({ id: t.String({ minLength: 1 }) }),
})
