import type * as SentryType from "@sentry/react"
import { env } from "@/env"

let isInitialized = false
let SentryInstance: typeof SentryType | null = null

export function initClientSentry(): void {
	if (
		isInitialized ||
		typeof window === "undefined" ||
		!env.VITE_SENTRY_DSN ||
		import.meta.env.MODE === "test"
	) {
		return
	}

	isInitialized = true

	import("@sentry/react")
		.then((Sentry) => {
			SentryInstance = Sentry
			Sentry.init({
				dsn: env.VITE_SENTRY_DSN,
				environment: import.meta.env.MODE,
				integrations: [
					Sentry.browserTracingIntegration(),
					Sentry.replayIntegration({
						maskAllText: false,
						blockAllMedia: false,
					}),
				],
				tracesSampleRate: env.VITE_SENTRY_TRACES_SAMPLE_RATE,
				replaysSessionSampleRate: env.VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE,
				replaysOnErrorSampleRate: env.VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE,
				beforeSend(event) {
					if (import.meta.env.DEV && event.level === "info") {
						return null
					}
					return event
				},
			})
		})
		.catch((error) => {
			console.warn("Failed to initialize Sentry:", error)
		})
}

export function captureClientException(
	error: unknown,
	context?: Record<string, unknown>
) {
	if (!SentryInstance) return

	if (context) {
		SentryInstance.withScope((scope) => {
			scope.setContext("additional", context)
			SentryInstance?.captureException(error)
		})
	} else {
		SentryInstance.captureException(error)
	}
}

export function setClientUser(user: { id: string; username?: string; email?: string }) {
	SentryInstance?.setUser(user)
}

export function clearClientUser() {
	SentryInstance?.setUser(null)
}
