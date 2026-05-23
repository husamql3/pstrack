import { Elysia } from "elysia"

import { auth } from "@/server/lib/auth"
import { captureServerException, initServerSentry } from "@/server/lib/sentry"
import { docs } from "@/server/modules/docs"
import { health } from "@/server/modules/health"

initServerSentry()

const api = new Elysia({ prefix: "/api/v3" })
	.use(health)
	.use(docs)
	.onError(({ error }) => captureServerException(error))

export const app = new Elysia()
	.all("/api/auth/*", ({ request }) => auth.handler(request))
	.use(api)

export type App = typeof api
