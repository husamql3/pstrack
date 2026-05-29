import { type Elysia, status } from "elysia"

import { auth } from "@/server/lib/auth"

export const getSessionUser = async (request: Request) => {
	const session = await auth.api.getSession({ headers: request.headers })
	return session?.user ?? null
}

export const requireSessionUser = async (request: Request) => {
	const user = await getSessionUser(request)
	if (!user) {
		return { user: null, response: status(401, { error: "Authentication required" }) }
	}
	return { user, response: null }
}

/**
 * Elysia plugin that injects the user into the context if they are logged in.
 * Does NOT block if the user is missing (optional auth).
 */
export const injectUser = (app: Elysia) =>
	app.derive(async ({ request }) => {
		const user = await getSessionUser(request)
		return { user }
	})

/**
 * Elysia plugin that ensures a user is authenticated.
 * Injects 'user' into the context and returns 401 if missing.
 */
export const isAuthenticated = (app: Elysia) =>
	app
		.use(injectUser)
		.derive(async ({ request }) => {
			const { user, response } = await requireSessionUser(request)
			return { user, authResponse: response }
		})
		.onBeforeHandle(({ user, authResponse }) => {
			if (!user) return authResponse
		})

/**
 * Elysia plugin that ensures a user is a platform admin.
 * Injects 'user' into context and returns 401/403 if missing/insufficient.
 */
export const isPlatformAdmin = (app: Elysia) =>
	app.use(isAuthenticated).onBeforeHandle(async ({ user }) => {
		// user is guaranteed to exist by isAuthenticated, but we need to check the role
		// we use requireSessionUser logic but tailored for admin
		// since 'user' from Better Auth might not have the freshest role, we check DB
		// Or if Better Auth syncs it, we can trust user.role
		if (user?.role !== "admin") {
			return status(403, { error: "Admin access required" })
		}
	})
