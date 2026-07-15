import { createRouter as createTanStackRouter } from "@tanstack/react-router"

import { initClientPostHog } from "@/lib/posthog"
import { getQueryClient } from "@/lib/query-client"
import { initClientSentry } from "@/lib/sentry"
import { routeTree } from "@/routeTree.gen"

initClientSentry()
initClientPostHog()

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		context: {
			queryClient: getQueryClient(),
		},
	})

	return router
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
