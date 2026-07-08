import { status } from "elysia"

import { auth } from "@/server/lib/auth"
import { db } from "@/server/lib/db"

type SessionPayload = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>
type SessionUser = SessionPayload["user"]
type SessionSession = SessionPayload["session"]

export const getSession = async (request: Request): Promise<SessionPayload | null> => {
	const session = await auth.api.getSession({ headers: request.headers })
	return session ?? null
}

export const getSessionUser = async (request: Request): Promise<SessionUser | null> => {
	const session = await getSession(request)
	return session?.user ?? null
}

export const requireSessionUser = async (request: Request) => {
	const user = await getSessionUser(request)
	if (!user) {
		return { user: null, response: status(401, { error: "Authentication required" }) }
	}
	return { user, response: null }
}

export const requireRealSession = async (request: Request) => {
	const session = await getSession(request)
	if (!session?.user) {
		return {
			user: null,
			session: null,
			response: status(401, { error: "Authentication required" }),
		}
	}
	if (
		(session.session as SessionSession & { impersonatedBy?: string | null })
			?.impersonatedBy
	) {
		return {
			user: null,
			session: null,
			response: status(403, { error: "Action not allowed during impersonation" }),
		}
	}
	return { user: session.user, session: session.session, response: null }
}

export const requirePlatformAdmin = async (request: Request) => {
	const { user, response } = await requireSessionUser(request)
	if (!user) return { user: null, response }

	const dbUser = await db.user.findUnique({
		where: { id: user.id },
		select: { role: true },
	})

	if (dbUser?.role !== "admin") {
		return {
			user: null,
			response: status(403, { error: "Admin access required" }),
		}
	}

	return { user, response: null }
}

export const requirePro = async (request: Request) => {
	const { user, response } = await requireSessionUser(request)
	if (!user) return { user: null, response }

	const dbUser = await db.user.findUnique({
		where: { id: user.id },
		select: { isPro: true },
	})

	if (!dbUser?.isPro) {
		return {
			user: null,
			response: status(403, { error: "Pro required" }),
		}
	}

	return { user, response: null }
}
