import { Elysia, status } from "elysia"

import { adminModel } from "@/server/admin/admin.model"
import { ADMIN_LIST_LIMIT_DEFAULT } from "@/server/admin/admin.type"
import { adminAuditDao } from "@/server/admin/admin-audit.dao"
import { requirePlatformAdmin } from "@/server/lib/session"
import { usersAdminDao } from "./users.admin.dao"
import { usersAdminNotifications } from "./users.admin.notifications"

export const usersAdminController = new Elysia({
	prefix: "/admin/users",
	tags: ["Admin"],
})
	.use(adminModel)
	.get(
		"/",
		async ({ request, query }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			return usersAdminDao.list({
				cursor: query.cursor ?? null,
				limit: query.limit ?? ADMIN_LIST_LIMIT_DEFAULT,
				q: query.q ?? null,
				role: query.role ?? null,
				isPro: query.isPro ?? null,
				banned: query.banned ?? null,
				sortBy: query.sortBy ?? null,
				sortDir: query.sortDir ?? "desc",
			})
		},
		{ query: "admin.users.list" }
	)
	.get(
		"/:id",
		async ({ request, params }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			const target = await usersAdminDao.get(params.id)
			if (!target) return status(404, { error: "User not found" })
			return target
		},
		{ params: "admin.users.idParams" }
	)
	.get(
		"/:id/points-history",
		async ({ request, params, query }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			return usersAdminDao.pointsHistory(
				params.id,
				query.limit ?? ADMIN_LIST_LIMIT_DEFAULT,
				query.cursor ?? null
			)
		},
		{ params: "admin.users.idParams", query: "admin.pagination" }
	)
	.patch(
		"/:id/ban",
		async ({ request, params, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			if (user.id === params.id) {
				return status(400, { error: "Cannot ban yourself" })
			}
			return usersAdminDao.setBan(user.id, params.id, body.banned, body.reason ?? null)
		},
		{ params: "admin.users.idParams", body: "admin.users.ban" }
	)
	.post(
		"/:id/points",
		async ({ request, params, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			return usersAdminDao.adjustPoints(user.id, params.id, body.delta, body.reason)
		},
		{ params: "admin.users.idParams", body: "admin.users.adjustPoints" }
	)
	.post(
		"/:id/pro",
		async ({ request, params, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			const result = await usersAdminDao.setPro(user.id, params.id, {
				grant: body.grant,
				expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
				reason: body.reason ?? null,
			})
			if (!result.ok) {
				if (result.error === "USER_NOT_FOUND") {
					return status(404, { error: "User not found" })
				}
				return status(409, {
					error:
						"Cannot revoke Pro for a Polar customer. Issue a refund in Polar instead.",
				})
			}
			if (result.becamePro) {
				usersAdminNotifications.proGranted(
					result.user.email,
					result.user.name,
					result.user.proExpiresAt
				)
			}
			return result.user
		},
		{ params: "admin.users.idParams", body: "admin.users.proGrant" }
	)
	.post(
		"/:id/impersonate-audit",
		async ({ request, params }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			if (user.id === params.id) {
				return status(400, { error: "Cannot impersonate yourself" })
			}
			await adminAuditDao.log({
				adminId: user.id,
				action: "USER_IMPERSONATED",
				target: { type: "USER", id: params.id },
				metadata: { targetId: params.id },
			})
			return { ok: true }
		},
		{ params: "admin.users.idParams" }
	)
	.post(
		"/:id/impersonate-end-audit",
		async ({ request, params, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			await adminAuditDao.log({
				adminId: user.id,
				action: "USER_IMPERSONATION_ENDED",
				target: { type: "USER", id: params.id },
				metadata: { targetId: params.id, durationMs: body.durationMs ?? null },
			})
			return { ok: true }
		},
		{
			params: "admin.users.idParams",
			body: "admin.users.impersonationEnded",
		}
	)
