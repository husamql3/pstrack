import { Elysia } from "elysia"
import pino from "pino"

const isDev = process.env.NODE_ENV !== "production"

export const logger = pino({
	base: null,
	...(isDev && {
		transport: {
			target: "pino-pretty",
			options: {
				colorize: true,
				ignore: "level,time",
				messageFormat: "{msg}",
			},
		},
	}),
})

const requestTimings = new WeakMap<Request, number>()

export const requestLogger = new Elysia({ name: "request-logger" })
	.onRequest(({ request }) => {
		requestTimings.set(request, performance.now())
	})
	.onAfterResponse(({ request, response, set }) => {
		const startedAt = requestTimings.get(request) ?? performance.now()
		const { pathname, search } = new URL(request.url)
		const method = request.method.toUpperCase()
		const status = Number(set.status)
		const durationMs = Number((performance.now() - startedAt).toFixed(2))
		const error = response instanceof Error ? JSON.stringify(response) : null

		logger.info(
			{ method, status, path: `${pathname}${search}`, durationMs, error },
			"[api]"
		)

		requestTimings.delete(request)
	})
	.as("global")
