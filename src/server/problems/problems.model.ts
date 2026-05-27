import Elysia, { t } from "elysia"

import { Roadmap } from "@/generated/prisma/enums"

export const problemsModel = new Elysia({ name: "model/problems" }).model({
	"problems.roadmapQuery": t.Object({
		roadmap: t.Optional(t.Enum(Roadmap)),
	}),
})
