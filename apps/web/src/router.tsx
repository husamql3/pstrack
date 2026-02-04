import { createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
	const router = createRouter({
		ssr: {
			nonce: "1234567890",
		},
		routeTree,
		context: {
			// user: null,
			// session: null,
		},
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
	});

	return router;
};

declare module "@tanstack/react-router" {
	interface Register {
		router: Awaited<ReturnType<typeof getRouter>>;
	}
}
