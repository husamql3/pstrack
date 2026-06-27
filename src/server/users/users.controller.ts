import { Elysia, status } from "elysia"

import { auth } from "@/server/lib/auth"
import { getSessionUser, requireSessionUser } from "@/server/lib/session"
import { isReservedUsername } from "./users.constants"
import { usersDao } from "./users.dao"
import { usersModel } from "./users.model"

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql"
const CODEFORCES_API = "https://codeforces.com/api/user.info"

export const usersController = new Elysia({ prefix: "/users", tags: ["Users"] })
	.use(usersModel)
	.post(
		"/check-username",
		async ({ body }) => {
			const normalized = body.username.toLowerCase()
			if (isReservedUsername(normalized)) {
				return { available: false, reason: "reserved" as const }
			}
			const existing = await usersDao.findByUsername(normalized)
			if (existing) return { available: false, reason: "taken" as const }
			return { available: true }
		},
		{ body: "users.checkUsername" }
	)
	.post(
		"/validate-leetcode",
		async ({ body }) => {
			try {
				const res = await fetch(LEETCODE_GRAPHQL, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						query: `query { matchedUser(username: "${body.handle}") { username } }`,
					}),
				})
				const json = (await res.json()) as {
					data?: { matchedUser?: { username: string } | null }
				}
				return { exists: !!json.data?.matchedUser }
			} catch {
				return status(502, { error: "Failed to reach LeetCode API" })
			}
		},
		{ body: "users.validateHandle" }
	)
	.post(
		"/validate-codeforces",
		async ({ body }) => {
			try {
				const url = `${CODEFORCES_API}?handles=${encodeURIComponent(body.handle)}`
				const res = await fetch(url)
				const json = (await res.json()) as { status: string }
				return { exists: json.status === "OK" }
			} catch {
				return status(502, { error: "Failed to reach Codeforces API" })
			}
		},
		{ body: "users.validateHandle" }
	)
	.get("/count", async () => {
		const count = await usersDao.count()
		return { count }
	})
	.get("/me", async ({ request }) => {
		const { user, response } = await requireSessionUser(request)
		if (!user) return response
		const me = await usersDao.findMe(user.id)
		if (!me) return status(404, { error: "User not found." })
		return me
	})
	.patch(
		"/me/username",
		async ({ body, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			const normalized = body.username.toLowerCase()
			if (isReservedUsername(normalized)) {
				return status(409, { error: "That username is reserved." })
			}

			const result = await usersDao.updateUsername(user.id, normalized)
			if (result.error === "TAKEN") {
				return status(409, { error: "That username is already taken." })
			}
			if (result.error === "COOLDOWN") {
				return status(429, {
					error: `You can change your username again on ${result.nextChangeAt.toLocaleDateString()}.`,
				})
			}
			return result.me
		},
		{ body: "users.updateUsername" }
	)
	.patch(
		"/me/profile",
		async ({ body, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			const patch: Parameters<typeof usersDao.updateProfile>[1] = {}
			if (body.name !== undefined) patch.name = body.name
			if (body.bio !== undefined) patch.bio = body.bio
			if (body.twitterHandle !== undefined) patch.twitterHandle = body.twitterHandle
			if (body.linkedinHandle !== undefined) patch.linkedinHandle = body.linkedinHandle
			if (body.websiteUrl !== undefined) patch.websiteUrl = body.websiteUrl
			if (body.isPublic !== undefined) patch.isPublic = body.isPublic
			return usersDao.updateProfile(user.id, patch)
		},
		{ body: "users.updateProfile" }
	)
	.patch(
		"/me/handles",
		async ({ body, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			return usersDao.updateHandles(user.id, {
				leetcodeHandle: body.leetcodeHandle,
				codeforcesHandle: body.codeforcesHandle ?? null,
			})
		},
		{ body: "users.updateHandles" }
	)
	.patch(
		"/me/notifications",
		async ({ body, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			return usersDao.updateNotifications(user.id, body)
		},
		{ body: "users.updateNotifications" }
	)
	.get("/me/sessions", async ({ request }) => {
		const { user, response } = await requireSessionUser(request)
		if (!user) return response

		const session = await auth.api.getSession({ headers: request.headers })
		const currentSessionId = session?.session.id ?? null
		const sessions = await auth.api.listSessions({ headers: request.headers })

		return (sessions ?? []).map((s) => ({
			id: s.id,
			createdAt: s.createdAt,
			updatedAt: s.updatedAt,
			expiresAt: s.expiresAt,
			ipAddress: s.ipAddress ?? null,
			userAgent: s.userAgent ?? null,
			isCurrent: s.id === currentSessionId,
		}))
	})
	.delete("/me/sessions/others", async ({ request }) => {
		const { user, response } = await requireSessionUser(request)
		if (!user) return response

		await auth.api.revokeOtherSessions({ headers: request.headers })
		return { success: true }
	})
	.delete(
		"/me/sessions/:id",
		async ({ params, request }) => {
			const { user, response } = await requireSessionUser(request)
			if (!user) return response

			await auth.api.revokeSession({
				headers: request.headers,
				body: { token: params.id },
			})
			return { success: true }
		},
		{ params: "users.sessionParams" }
	)
	.get(
		"/:username",
		async ({ params, request }) => {
			await getSessionUser(request)
			const profile = await usersDao.findPublicProfile(params.username.toLowerCase())
			if (!profile) return status(404, { error: "User not found." })
			return profile
		},
		{ params: "users.usernameParams" }
	)
	.get(
		"/:username/heatmap",
		async ({ params }) => {
			const days = await usersDao.findHeatmap(params.username.toLowerCase())
			if (!days) return status(404, { error: "User not found." })
			return days
		},
		{ params: "users.usernameParams" }
	)
