import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"

import { initClientSentry } from "@/lib/sentry"
import { routeTree } from "@/routeTree.gen"
import { getQueryClient } from "@/lib/query-client"

initClientSentry()

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		context: {
			queryClient: getQueryClient(),
		},
		// todo: replace with custom components
		defaultNotFoundComponent: () => <div>Not Found!</div>,
		defaultPendingComponent: () => <div>Loading...</div>,
		defaultErrorComponent: () => <div>Error!</div>,
	})

	return router
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
