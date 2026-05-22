import { Elysia } from "elysia"

import { auth } from "@/server/lib/auth"
import { captureServerException, initServerSentry } from "@/server/lib/sentry"
import { docs } from "@/server/modules/docs"
import { health } from "@/server/modules/health"

initServerSentry()

const api = new Elysia({ prefix: "/api/v3" }).use(health).use(docs)

export const app = new Elysia()
	.onError(({ error }) => captureServerException(error))
	.mount("/api/auth", auth.handler)
	.use(api)

export type App = typeof api
