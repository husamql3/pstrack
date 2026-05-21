import { Elysia } from "elysia"

import { captureServerException, initServerSentry } from "@/server/lib/sentry"

initServerSentry()

export const app = new Elysia({ prefix: "/api/v3" })
	.onError(({ error }) => {
		captureServerException(error)
	})
	.get("/health", () => "ok")

export type App = typeof app
