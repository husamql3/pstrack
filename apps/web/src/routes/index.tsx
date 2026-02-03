import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

const getSession = createServerFn({ method: "GET" }).handler(async () => {
	const { data, error } = await auth.getSession();

	console.log("[SERVER] getSession called"); // This logs on the SERVER
	console.log("[SERVER] data:", data);
	console.log("[SERVER] error:", error);

	if (error || !data?.session) {
		return { session: null, user: null };
	}

	return {
		session: data.session,
		user: data.user,
	};
});

export const Route = createFileRoute("/")({
	component: App,
	loader: async () => {
		const sessionData = await getSession();
		console.log("[LOADER] Session data received:", sessionData); // This might log on client too
		return sessionData;
	},
});

function App() {
	const { user, session } = Route.useLoaderData();
	console.log("[index.tsx] User:", user);
	console.log("[index.tsx] Session:", session);

	return (
		<>
			<div className="absolute top-7 left-5 z-10">
				<Link to="/login">
					<Button size="lg">Login</Button>
				</Link>

				<Link to="/dashboard">
					<Button size="lg">Dashboard</Button>
				</Link>

				{user && <Button onClick={() => auth.signOut()}>Logout</Button>}

				{user?.name && <span>Hello {user.name}</span>}
			</div>

			<div className="flex items-center justify-center h-dvh">
				<h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-muted mb-6 drop-shadow-2xl">
					PStrack.
				</h1>
			</div>
		</>
	);
}
