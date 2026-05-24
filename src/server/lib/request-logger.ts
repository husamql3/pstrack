import { Elysia } from "elysia"

const ANSI = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	gray: "\x1b[90m",
} as const

const requestTimings = new WeakMap<Request, number>()

const colorize = (value: string | number, color: string) =>
	`${color}${value}${ANSI.reset}`

const getTimestamp = () =>
	new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
		hour12: true,
	}).format(new Date())

const getMethodColor = (method: string) => {
	switch (method) {
		case "GET":
			return ANSI.green
		case "POST":
			return ANSI.blue
		case "PUT":
		case "PATCH":
			return ANSI.yellow
		case "DELETE":
			return ANSI.red
		default:
			return ANSI.magenta
	}
}

const getStatusColor = (status: number) => {
	if (status >= 500) {
		return ANSI.red
	}

	if (status >= 400) {
		return ANSI.yellow
	}

	if (status >= 300) {
		return ANSI.cyan
	}

	if (status >= 200) {
		return ANSI.green
	}

	return ANSI.magenta
}

export const requestLogger = new Elysia({ name: "request-logger" })
	.onRequest(({ request }) => {
		requestTimings.set(request, performance.now())
	})
	.onAfterResponse(({ request, set }) => {
		const startedAt = requestTimings.get(request) ?? performance.now()
		const { pathname, search } = new URL(request.url)
		const method = request.method.toUpperCase()
		const status = Number(set.status ?? 200)
		const durationMs = (performance.now() - startedAt).toFixed(2)

		console.info(
			[
				colorize(getTimestamp(), ANSI.dim),
				colorize("[api]", ANSI.blue),
				colorize(method, getMethodColor(method)),
				colorize(status, getStatusColor(status)),
				colorize(`${pathname}${search}`, ANSI.cyan),
				colorize(`${durationMs}ms`, ANSI.magenta),
			].join(" ")
		)

		requestTimings.delete(request)
	})
	.as("global")
