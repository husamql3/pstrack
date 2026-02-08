import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
	const router = createRouter({
		routeTree,
		defaultPreload: "intent",
		context: {},
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		Wrap: ({ children }) => children,
	});

	return router;
};
