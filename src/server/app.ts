import { Elysia } from "elysia"

import { adminController } from "@/server/admin/admin.controller"
import { badgesController } from "@/server/badges/badges.controller"
import { groupsAdminController } from "@/server/groups/groups.admin.controller"
import { groupsController } from "@/server/groups/groups.controller"
import { auth } from "@/server/lib/auth"
import { captureServerException, initServerSentry } from "@/server/lib/sentry"
import { docs } from "@/server/modules/docs"
import { health } from "@/server/modules/health"
import { problemsAdminController } from "@/server/problems/problems.admin.controller"
import { problemsController } from "@/server/problems/problems.controller"
import { usersAdminController } from "@/server/users/users.admin.controller"
import { usersController } from "@/server/users/users.controller"
import { requestLogger } from "./lib/request-logger"

initServerSentry()

const api = new Elysia({ prefix: "/api/v3" })
	.use(health)
	.use(docs)
	.use(usersController)
	.use(groupsController)
	.use(problemsController)
	.use(badgesController)
	.use(adminController)
	.use(usersAdminController)
	.use(groupsAdminController)
	.use(problemsAdminController)
	.onError(({ error }) => captureServerException(error))

export const app = new Elysia()
	.use(requestLogger)
	.all("/api/v3/auth/*", ({ request }) => auth.handler(request), {
		detail: { tags: ["Auth"] },
	})
	.get(
		"/api/v3/magic-link",
		({ request }) => {
			const { searchParams } = new URL(request.url)
			const token = searchParams.get("token") ?? ""
			const callbackURL = searchParams.get("callbackURL") || "/dashboard"
			const dest = `/api/v4/auth/magic-link/verify?token=${token}&callbackURL=${encodeURIComponent(callbackURL)}`
			return new Response(
				`<!DOCTYPE html><html><head><script>location.replace(${JSON.stringify(dest)})</script></head><body></body></html>`,
				{ headers: { "content-type": "text/html;charset=utf-8" } }
			)
		},
		{ detail: { tags: ["Auth"] } }
	)
	.use(api)

export type App = typeof api
