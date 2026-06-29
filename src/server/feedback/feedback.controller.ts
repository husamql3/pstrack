import { Elysia, status } from "elysia"

import { requirePlatformAdmin, requireSessionUser } from "@/server/lib/session"
import { feedbackDao } from "./feedback.dao"
import { feedbackModel } from "./feedback.model"

export const feedbackController = new Elysia({ prefix: "/feedbacks", tags: ["Feedback"] })
	.use(feedbackModel)
	.get(
		"/prompt",
		async ({ request, query }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response
			return feedbackDao.shouldShowPrompt(user.id, query.groupId)
		},
		{ query: "feedback.promptQuery" }
	)
	.post(
		"/",
		async ({ request, body }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response
			try {
				return await feedbackDao.submit(
					user.id,
					body.groupId,
					body.category,
					body.description ?? undefined
				)
			} catch {
				return status(409, { error: "Feedback already submitted for this group" })
			}
		},
		{ body: "feedback.submit" }
	)
	.get(
		"/",
		async ({ request, query }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			return feedbackDao.list(query.groupId, query.reviewed)
		},
		{ query: "feedback.adminList" }
	)
	.patch(
		"/:id/reviewed",
		async ({ request, params, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			try {
				return await feedbackDao.markReviewed(params.id, body.reviewed)
			} catch {
				return status(404, { error: "Feedback not found" })
			}
		},
		{ params: "feedback.idParams", body: "feedback.markReviewed" }
	)
