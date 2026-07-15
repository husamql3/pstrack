import { Elysia } from "elysia"
import pino from "pino"

const isDev = process.env.NODE_ENV !== "production"
const SENSITIVE_QUERY_KEYS = new Set([
	"code",
	"email",
	"password",
	"redirect",
	"state",
	"token",
])

export const logger = pino({
	base: null,
	messageKey: "message",
	...(isDev && {
		transport: {
			target: "pino-pretty",
			options: {
				colorize: true,
				ignore: "level,time",
				messageFormat: "{message}",
			},
		},
	}),
})

const requestContexts = new WeakMap<
	Request,
	{ requestId: string; shortRequestId: string; startedAt: number }
>()

const formatRequestTime = (date: Date) => {
	const month = date
		.toLocaleString("en-US", { month: "short", timeZone: "UTC" })
		.toUpperCase()
	const day = date.getUTCDate().toString().padStart(2, "0")
	const hours = date.getUTCHours().toString().padStart(2, "0")
	const minutes = date.getUTCMinutes().toString().padStart(2, "0")
	const seconds = date.getUTCSeconds().toString().padStart(2, "0")
	const milliseconds = date.getUTCMilliseconds().toString().padStart(3, "0")

	return `${month} ${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
}

const createRequestId = (request: Request) => {
	const incomingRequestId = request.headers.get("x-request-id")?.trim()

	if (incomingRequestId) {
		return incomingRequestId
	}

	return crypto.randomUUID()
}

const createShortRequestId = (requestId: string) =>
	`req_${requestId.replaceAll("-", "").slice(0, 12)}`

const sanitizePath = (url: URL) => {
	const params = new URLSearchParams(url.searchParams)

	for (const key of params.keys()) {
		if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
			params.set(key, "redacted")
		}
	}

	const search = params.toString()

	return `${url.pathname}${search ? `?${search}` : ""}`
}

const getStatus = (response: unknown, setStatus: unknown) => {
	const numericSetStatus = Number(setStatus)

	if (Number.isFinite(numericSetStatus) && numericSetStatus > 0) {
		return numericSetStatus
	}

	if (response instanceof Response) {
		return response.status
	}

	return 200
}

const getErrorSummary = (response: unknown) => {
	if (response instanceof Error) {
		return `${response.name}: ${response.message}`
	}

	return null
}

const isQuietSuccessfulSessionPoll = ({
	method,
	path,
	status,
}: {
	method: string
	path: string
	status: number
}) =>
	method === "GET" &&
	status >= 200 &&
	status < 400 &&
	path.startsWith("/api/v3/auth/get-session")

export const requestLogger = new Elysia({ name: "request-logger" })
	.onRequest(({ request, set }) => {
		const requestId = createRequestId(request)

		requestContexts.set(request, {
			requestId,
			shortRequestId: createShortRequestId(requestId),
			startedAt: performance.now(),
		})
		set.headers["x-request-id"] = requestId
	})
	.onAfterResponse(({ request, response, set }) => {
		const context = requestContexts.get(request) ?? {
			requestId: createRequestId(request),
			shortRequestId: "req_unknown",
			startedAt: performance.now(),
		}
		const url = new URL(request.url)
		const path = sanitizePath(url)
		const method = request.method.toUpperCase()
		const status = getStatus(response, set.status)
		const durationMs = Number((performance.now() - context.startedAt).toFixed(2))
		const errorSummary = getErrorSummary(response)
		const timestamp = formatRequestTime(new Date())
		const message = [
			timestamp,
			status.toString(),
			method,
			path,
			`${durationMs}ms`,
			context.shortRequestId,
			errorSummary,
		]
			.filter(Boolean)
			.join(" ")
		const metadata = {
			durationMs,
			errorName: response instanceof Error ? response.name : null,
			errorMessage: response instanceof Error ? response.message : null,
			err: response instanceof Error ? response : null,
			host: url.host,
			method,
			path,
			requestId: context.requestId,
			shortRequestId: context.shortRequestId,
			status,
			userAgent: request.headers.get("user-agent"),
		}

		if (isQuietSuccessfulSessionPoll({ method, path, status })) {
			logger.debug(metadata, message)
		} else if (status >= 500) {
			logger.error(metadata, message)
		} else if (status >= 400) {
			logger.warn(metadata, message)
		} else {
			logger.info(metadata, message)
		}

		requestContexts.delete(request)
	})
	.as("global")
