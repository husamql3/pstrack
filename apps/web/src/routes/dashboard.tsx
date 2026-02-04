import { createFileRoute, redirect } from "@tanstack/react-router";

import { getSession } from "@/lib/auth";
export const Route = createFileRoute("/dashboard")({
	beforeLoad: async () => {
		const { session, user } = await getSession();
		if (!session) {
			throw redirect({
				to: "/login",
			});
		}

		return { session, user };
	},
	loader: () => getSession(),
	pendingComponent: () => {
		return (
			<div className="flex items-center justify-center h-dvh">
				<div className="text-center">
					<p className="text-white">Loading...</p>
				</div>
			</div>
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { session, user } = Route.useLoaderData();

	return (
		<div>
			<span>id: {session?.id}</span>
			<br />
			<span>User: {user?.name}</span>
			<br />
			<h1>Hello "/dashboard"!</h1>
		</div>
	);
}
