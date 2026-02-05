import { createFileRoute } from "@tanstack/react-router";

import { authMiddleware } from "@/middleware/auth";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	server: {
		middleware: [authMiddleware],
	},
});

function RouteComponent() {
	return <div>Hello "/dashboard"!</div>;
}
