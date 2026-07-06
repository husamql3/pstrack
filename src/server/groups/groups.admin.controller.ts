import { Elysia, status } from "elysia"

import { SystemEventTargetType, SystemEventType } from "@/generated/prisma/enums"
import { adminModel } from "@/server/admin/admin.model"
import { ADMIN_LIST_LIMIT_DEFAULT } from "@/server/admin/admin.type"
import { requirePlatformAdmin } from "@/server/lib/session"
import { systemEventsDao } from "@/server/system-events/system-events.dao"
import { groupsAdminDao } from "./groups.admin.dao"
import { groupNotifications } from "./groups.notifications"

export const groupsAdminController = new Elysia({
	prefix: "/admin/groups",
	tags: ["Admin"],
})
	.use(adminModel)
	.post(
		"/",
		async ({ request, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			return groupsAdminDao.create(user.id, body)
		},
		{ body: "admin.groups.create" }
	)
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
	.get("/pending-requests", async ({ request }) => {
		const { user, response } = await requirePlatformAdmin(request)
		if (!user) return response
		return groupsAdminDao.listAllPendingRequests()
	})
	.get(
		"/:id",
		async ({ request, params }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			const group = await groupsAdminDao.findById(params.id)
			if (!group) return status(404, { error: "Group not found" })
			return group
		},
		{ params: "admin.groups.idParams" }
	)
	.get(
		"/:id/members",
		async ({ request, params }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			return groupsAdminDao.listMembers(params.id)
		},
		{ params: "admin.groups.idParams" }
	)
	.delete(
		"/:id/members/:userId",
		async ({ request, params }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response

			const result = await groupsAdminDao.removeMember(params.id, params.userId)
			if (result.error === "NOT_FOUND") return status(404, { error: "Member not found." })

			groupNotifications.memberRemoved(params.id, params.userId)
			systemEventsDao
				.log({
					actorId: user.id,
					actorUsername: user.username ?? undefined,
					actorName: user.name,
					eventType: SystemEventType.MEMBER_REMOVED,
					targetType: SystemEventTargetType.GROUP,
					targetId: params.id,
					metadata: { removedUserId: params.userId },
				})
				.catch(() => {})
			return { success: true }
		},
		{ params: "admin.groups.memberParams" }
	)
	.get(
		"/:id/join-requests",
		async ({ request, params }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			return groupsAdminDao.listJoinRequests(params.id)
		},
		{ params: "admin.groups.idParams" }
	)
	.patch(
		"/:id/join-requests/:requestId",
		async ({ request, params, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response

			const result = await groupsAdminDao.updateJoinRequest(
				params.id,
				params.requestId,
				body.action
			)
			if (result.error === "NOT_FOUND") {
				return status(404, { error: "Join request not found." })
			}
			if (result.error === "ALREADY_PROCESSED") {
				return status(409, { error: "This request has already been processed." })
			}
			if (result.error === "FULL") return status(409, { error: "The group is now full." })

			if (body.action === "APPROVED") {
				groupNotifications.joinApproved(params.id, result.requesterId)
				systemEventsDao
					.log({
						actorId: user.id,
						actorUsername: user.username ?? undefined,
						actorName: user.name,
						eventType: SystemEventType.JOIN_REQUEST_APPROVED,
						targetType: SystemEventTargetType.GROUP,
						targetId: params.id,
						metadata: { requesterId: result.requesterId },
					})
					.catch(() => {})
			} else {
				groupNotifications.joinRejected(params.id, result.requesterId)
				systemEventsDao
					.log({
						actorId: user.id,
						actorUsername: user.username ?? undefined,
						actorName: user.name,
						eventType: SystemEventType.JOIN_REQUEST_REJECTED,
						targetType: SystemEventTargetType.GROUP,
						targetId: params.id,
						metadata: { requesterId: result.requesterId },
					})
					.catch(() => {})
			}

			return { success: true }
		},
		{
			params: "admin.groups.joinRequestParams",
			body: "admin.groups.joinRequestAction",
		}
	)
	.post(
		"/:id/invite",
		async ({ request, params, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			const result = await groupsAdminDao.generateInvite(params.id, body.expiresIn)
			return result
		},
		{
			params: "admin.groups.idParams",
			body: "admin.groups.generateInvite",
		}
	)
	.delete(
		"/:id/invite",
		async ({ request, params }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			await groupsAdminDao.revokeInvite(params.id)
			return { success: true }
		},
		{ params: "admin.groups.idParams" }
	)
	.patch(
		"/:id/start",
		async ({ request, params }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			const result = await groupsAdminDao.start(user.id, params.id)
			if ("error" in result) {
				if (result.error === "ALREADY_STARTED") {
					return status(409, { error: "Group has already started" })
				}
				return status(404, { error: "Group not found" })
			}
			return result
		},
		{ params: "admin.groups.idParams" }
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
