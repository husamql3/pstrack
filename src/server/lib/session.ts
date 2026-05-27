import { status } from "elysia"

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
