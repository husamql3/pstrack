import type { User } from "@sentry/node"
import * as Sentry from "@sentry/node"

import { env } from "@/env"
import { notifyAdmin } from "@/server/lib/bot"

let isInitialized = false

export function initServerSentry() {
	if (isInitialized || !env.SENTRY_DSN) {
		return
	}

	isInitialized = true

	Sentry.init({
		dsn: env.SENTRY_DSN,
		environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
		tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
		beforeSend(event) {
			// Filter out known low-value errors
			if (event.level === "info" && env.NODE_ENV === "development") {
				return null
			}
			return event
		},
	})
}

const ERROR_MESSAGE_MAX = 300

// Strip anything email- or token-shaped before it heads to the (plain-text)
// Telegram channel. The unredacted detail still lands fully in Sentry.
const redactForBot = (value: string): string =>
	value
		.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
		.replace(/\b[A-Za-z0-9_-]{24,}\b/g, "[token]")

// Pull the first "at … (path:line:col)" frame out of a stack trace and shorten
// the path to its last two segments so the culprit stays readable in a chat.
const topStackFrame = (stack: string | undefined): string | undefined => {
	if (!stack) return undefined
	for (const line of stack.split("\n")) {
		const match = line.match(/\(?([^\s()]+:\d+:\d+)\)?\s*$/)
		if (match && /[/\\]/.test(match[1])) {
			return match[1].split(/[/\\]/).slice(-2).join("/")
		}
	}
	return undefined
}

const currentUserId = (): string | undefined => {
	try {
		const id = Sentry.getCurrentScope().getUser()?.id
		return id == null ? undefined : String(id)
	} catch {
		return undefined
	}
}

// Mirror a server-side capture to the admin Telegram bot as `error.captured`.
// Production-only (dev/stage churn would dilute the channel) and fire-and-forget
// — the bot side owns dedup + rate-limiting so an error storm can't flood chat.
function teeErrorToBot(error: unknown, context?: Record<string, unknown>) {
	if (env.NODE_ENV !== "production") return

	const err = error instanceof Error ? error : undefined
	const errorType = err?.name ?? "UnknownError"
	const message = redactForBot(err?.message ?? String(error)).slice(0, ERROR_MESSAGE_MAX)
	const culprit = topStackFrame(err?.stack)
	const route = typeof context?.route === "string" ? context.route : undefined
	const method = typeof context?.method === "string" ? context.method : undefined
	const tag = typeof context?.tag === "string" ? context.tag : undefined
	const userId =
		(typeof context?.userId === "string" ? context.userId : undefined) ?? currentUserId()

	void notifyAdmin("error.captured", {
		errorType,
		message,
		culprit,
		route,
		method,
		tag,
		userId,
		environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
		fingerprint: `${errorType}:${culprit ?? "unknown"}`,
		occurredAt: new Date().toISOString(),
	})
}

export function captureServerException(
	error: unknown,
	context?: Record<string, unknown>
) {
	if (context) {
		Sentry.withScope((scope) => {
			scope.setContext("additional", context)
			Sentry.captureException(error)
		})
	} else {
		Sentry.captureException(error)
	}
	teeErrorToBot(error, context)
}

export function captureServerMessage(message: string, context: Record<string, unknown>) {
	Sentry.withScope((scope) => {
		scope.setContext("additional", context)
		Sentry.captureMessage(message, "warning")
	})
}

export function setServerUser(user: Pick<User, "id" | "username" | "email">) {
	Sentry.setUser(user)
}

export function clearServerUser() {
	Sentry.setUser(null)
}

export { Sentry as ServerSentry }
