import { createFileRoute, redirect } from "@tanstack/react-router";

import { auth } from "@/lib/auth";

const getSession = async () => {
	const { data, error } = await auth.getSession();
	if (error || !data?.session) {
		return { session: null, user: null };
	}

	return {
		session: data.session,
		user: data.user,
	};
};

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	loader: async () => {
		const { session, user } = await getSession();
		console.log("[LOADER] Session data received:", session); // This might log on client too
		console.log("[LOADER] User data received:", user); // This might log on client too
		if (!session) {
			throw redirect({
				to: "/login",
			});
		}

		return { session, user };
	},
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
