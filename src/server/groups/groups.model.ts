import Elysia, { t } from "elysia"

export const groupsModel = new Elysia({ name: "model/groups" }).model({
	"groups.create": t.Object({
		name: t.String({ minLength: 3, maxLength: 80 }),
		description: t.Optional(t.String({ maxLength: 240 })),
	}),
	"groups.joinParams": t.Object({
		id: t.String({ minLength: 1 }),
	}),
	"groups.groupIdParams": t.Object({
		id: t.String({ minLength: 1 }),
	}),
	"groups.memberParams": t.Object({
		id: t.String({ minLength: 1 }),
		userId: t.String({ minLength: 1 }),
	}),
	"groups.joinRequestParams": t.Object({
		id: t.String({ minLength: 1 }),
		requestId: t.String({ minLength: 1 }),
	}),
	"groups.updateSettings": t.Object({
		name: t.Optional(t.String({ minLength: 3, maxLength: 80 })),
		description: t.Optional(t.Nullable(t.String({ maxLength: 240 }))),
	}),
	"groups.joinRequestAction": t.Object({
		action: t.Union([t.Literal("APPROVED"), t.Literal("REJECTED")]),
	}),
	"groups.generateInvite": t.Object({
		expiresIn: t.Union([
			t.Literal("7d"),
			t.Literal("30d"),
			t.Literal("90d"),
			t.Literal("never"),
		]),
	}),
	"groups.joinByInvite": t.Object({
		inviteCode: t.String({ minLength: 1 }),
	}),
})
