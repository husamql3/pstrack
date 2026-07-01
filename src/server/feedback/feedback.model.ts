import Elysia, { t } from "elysia"

import { FeedbackCategory } from "@/generated/prisma/enums"

export const feedbackModel = new Elysia({ name: "model/feedback" }).model({
	"feedback.submit": t.Object({
		groupId: t.String({ minLength: 1 }),
		category: t.Enum(FeedbackCategory),
		description: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
	}),
	"feedback.submitGeneral": t.Object({
		description: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
	}),
	"feedback.promptQuery": t.Object({
		groupId: t.String({ minLength: 1 }),
	}),
	"feedback.adminList": t.Object({
		groupId: t.Optional(t.String({ minLength: 1 })),
		reviewed: t.Optional(t.Boolean()),
	}),
	"feedback.idParams": t.Object({
		id: t.String({ minLength: 1 }),
	}),
	"feedback.markReviewed": t.Object({
		reviewed: t.Boolean(),
	}),
})
