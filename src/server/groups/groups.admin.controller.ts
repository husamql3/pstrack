import { Elysia, status } from "elysia"

import { adminModel } from "@/server/admin/admin.model"
import { ADMIN_LIST_LIMIT_DEFAULT } from "@/server/admin/admin.type"
import { requirePlatformAdmin } from "@/server/lib/session"
import { groupsAdminDao } from "./groups.admin.dao"

export const groupsAdminController = new Elysia({
	prefix: "/admin/groups",
	tags: ["Admin"],
})
	.use(adminModel)
	.get(
		"/",
		async ({ request, query }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			return groupsAdminDao.list({
				cursor: query.cursor ?? null,
				limit: query.limit ?? ADMIN_LIST_LIMIT_DEFAULT,
				q: query.q ?? null,
				type: query.type ?? null,
				frozen: query.frozen ?? null,
				isActive: query.isActive ?? null,
				sortBy: query.sortBy ?? null,
				sortDir: query.sortDir ?? "desc",
			})
		},
		{ query: "admin.groups.list" }
	)
	.patch(
		"/:id/freeze",
		async ({ request, params, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			try {
				return await groupsAdminDao.setFrozen(user.id, params.id, body.frozen)
			} catch {
				return status(404, { error: "Group not found" })
			}
		},
		{ params: "admin.groups.idParams", body: "admin.groups.freeze" }
	)
	.delete(
		"/:id",
		async ({ request, params }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			const result = await groupsAdminDao.delete(user.id, params.id)
			if (!result.ok) return status(404, { error: "Group not found" })
			return { ok: true, slug: result.slug }
		},
		{ params: "admin.groups.idParams" }
	)
