import { Elysia } from "elysia"

import { adminController } from "@/server/admin/admin.controller"
import { authController } from "@/server/auth/auth.controller"
import { badgesController } from "@/server/badges/badges.controller"
import { feedbackController } from "@/server/feedback/feedback.controller"
import { groupsAdminController } from "@/server/groups/groups.admin.controller"
import { groupsController } from "@/server/groups/groups.controller"
import { internalController } from "@/server/internal/internal.controller"
import { jobsController } from "@/server/jobs/jobs.controller"
import { leaderboardController } from "@/server/leaderboard/leaderboard.controller"
import { auth } from "@/server/lib/auth"
import { securityHeaders } from "@/server/lib/security-headers"
import {
	captureServerException,
	initServerSentry,
	ServerSentry,
} from "@/server/lib/sentry"
import { docs } from "@/server/modules/docs"
import { health } from "@/server/modules/health"
import { og } from "@/server/modules/og"
import { problemsAdminController } from "@/server/problems/problems.admin.controller"
import { problemsController } from "@/server/problems/problems.controller"
import { securityController } from "@/server/security/security.controller"
import { usersAdminController } from "@/server/users/users.admin.controller"
import { usersController } from "@/server/users/users.controller"
import { logger, requestLogger } from "./lib/logger"

initServerSentry()

const api = new Elysia({ prefix: "/api/v3" })
	.use(health)
	.use(docs)
	.use(og)
	.use(authController)
	.use(usersController)
	.use(groupsController)
	.use(problemsController)
	.use(securityController)
	.use(badgesController)
	.use(feedbackController)
	.use(internalController)
	.use(jobsController)
	.use(leaderboardController)
	.use(adminController)
	.use(usersAdminController)
	.use(groupsAdminController)
	.use(problemsAdminController)
	.onError(async ({ error, request }) => {
		const { pathname } = new URL(request.url)
		logger.error({ err: error, path: pathname }, "[api-error]")
		console.error("[api-error]", pathname, error)
		captureServerException(error, { route: pathname, method: request.method })
		await ServerSentry.flush(2000)
	})

export const app = new Elysia()
	.use(requestLogger)
	.use(securityHeaders)
	.all("/api/v3/auth/*", ({ request }) => auth.handler(request), {
		detail: { tags: ["Auth"] },
	})
	.use(api)

export type App = typeof api
