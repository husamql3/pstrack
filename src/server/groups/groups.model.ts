import Elysia, { t } from "elysia"

export const groupsModel = new Elysia({ name: "model/groups" }).model({
	"groups.create": t.Object({}),
	"groups.joinParams": t.Object({
		id: t.String({ minLength: 1 }),
	}),
	"groups.groupIdParams": t.Object({
		id: t.String({ minLength: 1 }),
	}),
	"groups.joinByInvite": t.Object({
		inviteCode: t.String({ minLength: 1 }),
	}),
	"groups.problemsTableQuery": t.Object({
		range: t.Union([t.Literal("7d"), t.Literal("30d"), t.Literal("all")]),
		cursor: t.Optional(t.String({ minLength: 1 })),
	}),
})
