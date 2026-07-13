import { env } from "@/env"

let isInitialized = false

export function initClientPostHog(): void {
	if (
		isInitialized ||
		typeof window === "undefined" ||
		!import.meta.env.PROD ||
		!env.VITE_POSTHOG_ENABLED ||
		!env.VITE_POSTHOG_KEY ||
		import.meta.env.MODE === "test"
	) {
		return
	}

	isInitialized = true

	import("posthog-js")
		.then(({ default: posthog }) => {
			posthog.init(env.VITE_POSTHOG_KEY ?? "", {
				api_host: env.VITE_POSTHOG_HOST,
				defaults: "2026-05-30",
				loaded(client) {
					if (import.meta.env.DEV) {
						client.debug()
					}
				},
			})
		})
		.catch((error) => {
			console.warn("Failed to initialize PostHog:", error)
		})
}
