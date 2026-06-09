import type { User } from "@sentry/node"
import * as Sentry from "@sentry/node"

import { env } from "@/env"

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
}

export function setServerUser(user: Pick<User, "id" | "username" | "email">) {
	Sentry.setUser(user)
}

export function clearServerUser() {
	Sentry.setUser(null)
}

export { Sentry as ServerSentry }
