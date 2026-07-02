import { Elysia, status, t } from "elysia"

import { env } from "@/env"
import {
	GroupMemberStatus,
	JoinRequestStatus,
	SolveStatus,
} from "@/generated/prisma/enums"
import { groupsAdminDao } from "@/server/groups/groups.admin.dao"
import { groupNotifications } from "@/server/groups/groups.notifications"
import { db } from "@/server/lib/db"

const getTodaySolveStats = async () => {
	const now = new Date()
	const today = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
	)

	const [totalSolves, solvers] = await Promise.all([
		db.userSolve.count({
			where: { status: SolveStatus.SOLVED, dailyProblem: { assignedDate: today } },
		}),
		db.userSolve.findMany({
			where: { status: SolveStatus.SOLVED, dailyProblem: { assignedDate: today } },
			select: { userId: true },
			distinct: ["userId"],
		}),
	])

	return { totalSolves, activeUsers: solvers.length }
}

const requireBotAuth = (request: Request): boolean => {
	const auth = request.headers.get("Authorization") ?? ""
	return !!env.BOT_NOTIFY_SECRET && auth === `Bearer ${env.BOT_NOTIFY_SECRET}`
}

export const internalController = new Elysia({ prefix: "/internal" })
	.patch(
		"/bot/join-requests/:requestId",
		async ({ request, params, body }) => {
			if (!requireBotAuth(request)) return status(401, { error: "Unauthorized" })

			const joinRequest = await db.groupJoinRequest.findUnique({
				where: { id: params.requestId },
				select: { groupId: true },
			})
			if (!joinRequest) return status(404, { error: "Join request not found." })

			const result = await groupsAdminDao.updateJoinRequest(
				joinRequest.groupId,
				params.requestId,
				body.action
			)
			if (result.error === "NOT_FOUND")
				return status(404, { error: "Join request not found." })
			if (result.error === "ALREADY_PROCESSED") {
				return status(409, { error: "This request has already been processed." })
			}
			if (result.error === "FULL") return status(409, { error: "The group is now full." })

			if (body.action === "APPROVED") {
				groupNotifications.joinApproved(joinRequest.groupId, result.requesterId)
			} else {
				groupNotifications.joinRejected(joinRequest.groupId, result.requesterId)
			}

			return { success: true }
		},
		{
			params: t.Object({ requestId: t.String({ minLength: 1 }) }),
			body: t.Object({ action: t.Union([t.Literal("APPROVED"), t.Literal("REJECTED")]) }),
			detail: { hide: true },
		}
	)
	.post(
		"/bot/join-requests/:requestId/transfer",
		async ({ request, params, body }) => {
			if (!requireBotAuth(request)) return status(401, { error: "Unauthorized" })

			const result = await groupsAdminDao.transferRequest(
				params.requestId,
				body.targetGroupId
			)
			if (result.error === "NOT_FOUND")
				return status(404, { error: "Join request not found." })
			if (result.error === "ALREADY_PROCESSED") {
				return status(409, { error: "This request has already been processed." })
			}
			if (result.error === "TARGET_NOT_FOUND") {
				return status(404, { error: "Target group not found." })
			}
			if (result.error === "FULL")
				return status(409, { error: "The target group is full." })

			groupNotifications.joinApproved(body.targetGroupId, result.userId)
			return { success: true }
		},
		{
			params: t.Object({ requestId: t.String({ minLength: 1 }) }),
			body: t.Object({ targetGroupId: t.String({ minLength: 1 }) }),
			detail: { hide: true },
		}
	)
	.get(
		"/bot/groups",
		async ({ request }) => {
			if (!requireBotAuth(request)) return status(401, { error: "Unauthorized" })

			const groups = await db.group.findMany({
				where: { isActive: true, frozen: false },
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					slug: true,
					maxMembers: true,
					_count: {
						select: { members: { where: { status: GroupMemberStatus.ACTIVE } } },
					},
				},
				take: 20,
			})

			return groups
				.filter((g) => g._count.members < g.maxMembers)
				.map((g) => ({
					id: g.id,
					slug: g.slug,
					available: g.maxMembers - g._count.members,
				}))
		},
		{ detail: { hide: true } }
	)
	.get(
		"/bot/join-requests",
		async ({ request }) => {
			if (!requireBotAuth(request)) return status(401, { error: "Unauthorized" })

			const requests = await groupsAdminDao.listAllPendingRequests()
			return requests.map((r) => ({
				requestId: r.id,
				groupName: `@${r.group.slug}`,
				userName: r.user.name ?? undefined,
				userHandle: r.user.username ?? undefined,
				requestedAt: r.createdAt.toISOString(),
			}))
		},
		{ detail: { hide: true } }
	)
	.get(
		"/bot",
		async ({ request }) => {
			const auth = request.headers.get("Authorization") ?? ""
			if (!env.BOT_NOTIFY_SECRET || auth !== `Bearer ${env.BOT_NOTIFY_SECRET}`) {
				return status(401, { error: "Unauthorized" })
			}

			const now = new Date()
			const today = new Date(
				Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
			)
			const twoDaysAgo = new Date(now.getTime() - 2 * 86_400_000)

			const [
				totalUsers,
				pendingRequests,
				unreviewedFeedbacks,
				solveStats,
				dailyProblemCount,
				signups48h,
			] = await Promise.all([
				db.user.count(),
				db.groupJoinRequest.count({ where: { status: JoinRequestStatus.PENDING } }),
				db.feedback.findMany({
					where: { reviewed: false },
					orderBy: { createdAt: "desc" },
					take: 5,
					select: {
						id: true,
						description: true,
						createdAt: true,
						user: { select: { email: true } },
					},
				}),
				getTodaySolveStats(),
				db.dailyProblem.count({ where: { assignedDate: today } }),
				db.user.count({ where: { createdAt: { gte: twoDaysAgo } } }),
			])

			return {
				users: { total: totalUsers },
				joinRequests: { pending: pendingRequests },
				feedbacks: {
					unreviewed: unreviewedFeedbacks.map((f) => ({
						id: f.id,
						userEmail: f.user.email,
						text: f.description ?? "",
						createdAt: f.createdAt.toISOString(),
					})),
				},
				solves: {
					today: solveStats.totalSolves,
					activeUsers: solveStats.activeUsers,
				},
				dailyProblem: { assignedForToday: dailyProblemCount > 0 },
				signups48h,
			}
		},
		{ detail: { hide: true } }
	)
