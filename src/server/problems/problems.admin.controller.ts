import { Elysia, status } from "elysia"

import { adminModel } from "@/server/admin/admin.model"
import { ADMIN_LIST_LIMIT_DEFAULT } from "@/server/admin/admin.type"
import { requirePlatformAdmin } from "@/server/lib/session"
import { problemsAdminDao } from "./problems.admin.dao"

export const problemsAdminController = new Elysia({
	prefix: "/admin/problems",
	tags: ["Admin"],
})
	.use(adminModel)
	.get(
		"/",
		async ({ request, query }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			return problemsAdminDao.list({
				cursor: query.cursor ?? null,
				limit: query.limit ?? ADMIN_LIST_LIMIT_DEFAULT,
				q: query.q ?? null,
				difficulty: query.difficulty ?? null,
				source: query.source ?? null,
				roadmap: query.roadmap ?? null,
				sortBy: query.sortBy ?? null,
				sortDir: query.sortDir ?? "asc",
			})
		},
		{ query: "admin.problems.list" }
	)
	.post(
		"/",
		async ({ request, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			const result = await problemsAdminDao.create(user.id, {
				slug: body.slug,
				title: body.title,
				difficulty: body.difficulty,
				topic: body.topic,
				leetcodeId: body.leetcodeId ?? null,
				neetcode250: body.neetcode250 ?? false,
				neetcode150: body.neetcode150 ?? false,
				blind75: body.blind75 ?? false,
			})
			if (!result.ok) {
				return status(409, { error: "A problem with this slug already exists" })
			}
			return result.problem
		},
		{ body: "admin.problems.create" }
	)
	.patch(
		"/:id",
		async ({ request, params, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			const result = await problemsAdminDao.update(user.id, params.id, body)
			if (!result.ok) return status(404, { error: "Problem not found" })
			return result.problem
		},
		{ params: "admin.problems.idParams", body: "admin.problems.update" }
	)
	.delete(
		"/:id",
		async ({ request, params }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			const result = await problemsAdminDao.delete(user.id, params.id)
			if (!result.ok) {
				if (result.error === "NOT_FOUND") {
					return status(404, { error: "Problem not found" })
				}
				return status(409, {
					error: "Problem has been assigned to groups; cannot delete",
				})
			}
			return { ok: true }
		},
		{ params: "admin.problems.idParams" }
	)
	.post("/seed", async ({ request }) => {
		const { user, response } = await requirePlatformAdmin(request)
		if (!user) return response
		return problemsAdminDao.reseed(user.id)
	})
