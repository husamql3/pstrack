import { Elysia, status } from "elysia"

import { getSessionUser, requireSessionUser } from "@/server/lib/session"
import { groupsDao } from "./groups.dao"
import { groupsModel } from "./groups.model"

export const groupsController = new Elysia({ prefix: "/groups" })
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

			const result = await groupsDao.createPublic(user.id)
			if (result.error === "GROUP_LIMIT") {
				return status(403, { error: "You have reached your group limit." })
			}

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
	.patch(
		"/:id",
		async ({ params, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			const result = await groupsDao.updateSettings(user.id, params.id)
			if (result.error === "FORBIDDEN") {
				return status(403, { error: "You must be an admin to update this group." })
			}

			return result.group
		},
		{ params: "groups.groupIdParams", body: "groups.updateSettings" }
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
			if (result.error === "LAST_ADMIN") {
				return status(400, {
					error: "You are the last admin. Promote another member before leaving.",
				})
			}

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
	.delete(
		"/:id/members/:userId",
		async ({ params, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			const result = await groupsDao.removeMember(user.id, params.id, params.userId)
			if (result.error === "FORBIDDEN") {
				return status(403, { error: "You must be an admin to remove members." })
			}
			if (result.error === "NOT_FOUND") return status(404, { error: "Member not found." })
			if (result.error === "CANNOT_REMOVE_SELF") {
				return status(400, { error: "Use the leave endpoint to leave a group." })
			}

			return { success: true }
		},
		{ params: "groups.memberParams" }
	)
	.get(
		"/:id/join-requests",
		async ({ params, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			const result = await groupsDao.listJoinRequests(user.id, params.id)
			if (result.error === "FORBIDDEN") {
				return status(403, { error: "You must be an admin to view join requests." })
			}

			return result.requests
		},
		{ params: "groups.groupIdParams" }
	)
	.patch(
		"/:id/join-requests/:requestId",
		async ({ params, body, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			const result = await groupsDao.updateJoinRequest(
				user.id,
				params.id,
				params.requestId,
				body.action
			)
			if (result.error === "FORBIDDEN") {
				return status(403, { error: "You must be an admin to process join requests." })
			}
			if (result.error === "NOT_FOUND")
				return status(404, { error: "Join request not found." })
			if (result.error === "ALREADY_PROCESSED") {
				return status(409, { error: "This request has already been processed." })
			}
			if (result.error === "FULL") return status(409, { error: "The group is now full." })
			if (result.error === "USER_GROUP_LIMIT") {
				return status(409, { error: "The user has reached their group limit." })
			}

			return { success: true }
		},
		{ params: "groups.joinRequestParams", body: "groups.joinRequestAction" }
	)
	.post(
		"/:id/invite",
		async ({ params, body, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			const result = await groupsDao.generateInvite(user.id, params.id, body.expiresIn)
			if (result.error === "FORBIDDEN") {
				return status(403, { error: "You must be an admin to generate invite links." })
			}

			return { inviteCode: result.inviteCode }
		},
		{ params: "groups.groupIdParams", body: "groups.generateInvite" }
	)
	.delete(
		"/:id/invite",
		async ({ params, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			const result = await groupsDao.revokeInvite(user.id, params.id)
			if (result.error === "FORBIDDEN") {
				return status(403, { error: "You must be an admin to revoke invite links." })
			}

			return { success: true }
		},
		{ params: "groups.groupIdParams" }
	)
