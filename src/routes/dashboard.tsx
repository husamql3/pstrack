import { createFileRoute, redirect } from "@tanstack/react-router";

import { authMiddleware } from "@/middleware/auth";

export const Route = createFileRoute("/dashboard")({
	// Apply auth middleware - this sets user and session in context
	server: {
		middleware: [authMiddleware],
	},
	// Access context in loader
	loader: async ({ context }) => {
		// context.user and context.session are available because middleware set them
		const { user, session } = context;
		if (!user || !session) {
			throw redirect({ to: "/login" });
		}
		return { user, session };
	},
	component: DashboardComponent,
});

function DashboardComponent() {
	const { user, session } = Route.useLoaderData();
	console.log("USER DATA:", user, session);
	return (
		<div className="container mx-auto p-8">
			<pre>{JSON.stringify(user, null, 2)}</pre>
			<pre>{JSON.stringify(session, null, 2)}</pre>
		</div>
	);
}
