import { Elysia, status } from "elysia"

import { usersDao } from "./users.dao"
import { usersModel } from "./users.model"

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql"
const CODEFORCES_API = "https://codeforces.com/api/user.info"

export const usersController = new Elysia({ prefix: "/users", tags: ["Users"] })
	.use(usersModel)
	.post(
		"/check-username",
		async ({ body }) => {
			const existing = await usersDao.findByUsername(body.username)
			return { available: !existing }
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
