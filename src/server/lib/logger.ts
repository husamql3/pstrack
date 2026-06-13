import { Elysia } from "elysia"
import pino from "pino"

export const logger = pino({ base: null })

const requestTimings = new WeakMap<Request, number>()

export const requestLogger = new Elysia({ name: "request-logger" })
	.onRequest(({ request }) => {
		requestTimings.set(request, performance.now())
	})
	.onAfterResponse(({ request, set }) => {
		const startedAt = requestTimings.get(request) ?? performance.now()
		const { pathname, search } = new URL(request.url)
		const method = request.method.toUpperCase()
		const status = Number(set.status)
		const durationMs = Number((performance.now() - startedAt).toFixed(2))

		logger.info({ method, status, path: `${pathname}${search}`, durationMs }, "[api]")

		requestTimings.delete(request)
	})
	.as("global")
