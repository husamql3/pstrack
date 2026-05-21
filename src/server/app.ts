import { Elysia } from "elysia"

import { captureServerException, initServerSentry } from "@/server/lib/sentry"
import { health } from "@/server/modules/health"

initServerSentry()

export const app = new Elysia({ prefix: "/api/v3" })
	.onError(({ error }) => {
		captureServerException(error)
	})
	.use(health)

export type App = typeof app
