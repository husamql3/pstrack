import Elysia, { t } from "elysia"

export const problemsModel = new Elysia({ name: "model/problems" }).model({
	"problems.roadmapQuery": t.Object({
		roadmap: t.Optional(t.String({ minLength: 1 })),
	}),
})
