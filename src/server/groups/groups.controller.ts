import { Elysia, status } from "elysia"

import { SystemEventTargetType, SystemEventType } from "@/generated/prisma/enums"
import { notifyAdmin } from "@/server/lib/bot"
import { getSessionUser, requireSessionUser } from "@/server/lib/session"
import { systemEventsDao } from "@/server/system-events/system-events.dao"
import { groupsDao } from "./groups.dao"
import { groupsModel } from "./groups.model"

export const groupsController = new Elysia({ prefix: "/groups", tags: ["Groups"] })
	.use(groupsModel)
	.post(
		"/join-by-invite",
		async ({ body, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			const result = await groupsDao.joinByInvite(user.id, body.inviteCode)
			if (result.error === "INVALID_CODE") {
				return status(404, { error: "Invalid or expired invite link." })
			}
			if (result.error === "FULL") return status(409, { error: "This group is full." })
			if (result.error === "GROUP_LIMIT") {
				return status(403, { error: "You have reached your group limit." })
			}

			systemEventsDao
				.log({
					actorId: user.id,
					actorUsername: user.username ?? undefined,
					actorName: user.name,
					eventType: SystemEventType.GROUP_JOINED,
					targetType: SystemEventTargetType.GROUP,
					targetId: result.groupId,
				})
				.catch(() => {})
			return { status: result.status, groupId: result.groupId }
		},
		{ body: "groups.joinByInvite" }
	)
	.get("/", async ({ request }) => {
		const user = await getSessionUser(request)
		return groupsDao.listAll(user?.id)
	})
	.post(
		"/",
		async ({ request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			if (!user.isPro && user.role !== "admin") {
				return status(403, { error: "Creating a group requires a Pro account." })
			}

			const result = await groupsDao.createPublic(user.id)
			if (result.error === "GROUP_LIMIT") {
				return status(403, { error: "You have reached your group limit." })
			}

			systemEventsDao
				.log({
					actorId: user.id,
					actorUsername: user.username ?? undefined,
					actorName: user.name,
					eventType: SystemEventType.GROUP_CREATED,
					targetType: SystemEventTargetType.GROUP,
					targetId: result.group?.id,
					metadata: { slug: result.group?.slug ?? null },
				})
				.catch(() => {})
			return result.group
		},
		{ body: "groups.create" }
	)
	.get(
		"/:id",
		async ({ params, request }) => {
			const user = await getSessionUser(request)
			const group = await groupsDao.findById(user?.id, params.id)
			if (!group) return status(404, { error: "Group not found." })
			return group
		},
		{ params: "groups.groupIdParams" }
	)
	.post(
		"/:id/join",
		async ({ params, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			const result = await groupsDao.requestToJoin(user.id, params.id)
			if (result.error === "NOT_FOUND") return status(404, { error: "Group not found." })
			if (result.error === "FULL") return status(409, { error: "This group is full." })
			if (result.error === "GROUP_LIMIT") {
				return status(403, { error: "You have reached your group limit." })
			}
			if (result.error === "INVITE_REQUIRED") {
				return status(403, { error: "Private groups require an invite link." })
			}

			if (result.status === "REQUESTED") {
				notifyAdmin("join.requested", {
					requestId: result.requestId,
					groupId: params.id,
					groupName: `@${result.groupSlug}`,
					userEmail: user.email,
					userName: user.name,
					requestedAt: new Date().toISOString(),
				})
				systemEventsDao
					.log({
						actorId: user.id,
						actorUsername: user.username ?? undefined,
						actorName: user.name,
						eventType: SystemEventType.JOIN_REQUEST_SENT,
						targetType: SystemEventTargetType.GROUP,
						targetId: params.id,
					})
					.catch(() => {})
			}

			return { status: result.status }
		},
		{ params: "groups.joinParams" }
	)
	.post(
		"/:id/leave",
		async ({ params, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			const result = await groupsDao.leave(user.id, params.id)
			if (result.error === "NOT_MEMBER") {
				return status(400, { error: "You are not a member of this group." })
			}

			systemEventsDao
				.log({
					actorId: user.id,
					actorUsername: user.username ?? undefined,
					actorName: user.name,
					eventType: SystemEventType.GROUP_LEFT,
					targetType: SystemEventTargetType.GROUP,
					targetId: params.id,
				})
				.catch(() => {})
			return { success: true }
		},
		{ params: "groups.groupIdParams" }
	)
	.get(
		"/:id/members",
		async ({ params }) => {
			return groupsDao.listMembers(params.id)
		},
		{ params: "groups.groupIdParams" }
	)
	.get(
		"/:id/today-activity",
		async ({ params, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			const result = await groupsDao.getTodayActivity(params.id, user.id)
			if (!result) return status(403, { error: "Not a member of this group." })
			return result
		},
		{ params: "groups.groupIdParams" }
	)
	.get(
		"/:id/problems",
		async ({ params, query, request }) => {
			const user = await getSessionUser(request)
			const cursor = query.cursor ? new Date(query.cursor) : undefined
			const result = await groupsDao.getProblemsTable(
				user?.id,
				params.id,
				query.range,
				cursor
			)
			if (result.error === "NOT_FOUND") return status(404, { error: "Group not found." })
			if (result.error === "FORBIDDEN") {
				return status(403, { error: "Members only." })
			}
			return result.data
		},
		{ params: "groups.groupIdParams", query: "groups.problemsTableQuery" }
	)
