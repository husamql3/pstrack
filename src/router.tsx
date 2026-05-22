import { createRouter as createTanStackRouter } from "@tanstack/react-router"

import { initClientSentry } from "./lib/sentry"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
	initClientSentry()

	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		context: {},

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
