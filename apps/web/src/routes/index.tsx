import { createFileRoute, Link, useRouter } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { getSession, signOut } from "@/lib/auth";

export const Route = createFileRoute("/")({
	loader: () => getSession(),
	pendingComponent: () => {
		return (
			<div className="flex items-center justify-center h-dvh">
				<p className="text-white">Loading...</p>
			</div>
		);
	},
	component: App,
});

function App() {
	const router = useRouter();
	const { session, user } = Route.useLoaderData();

	const handleLogout = async () => {
		await signOut();
		router.navigate({ to: "/login" });
	};

	return (
		<>
			<div className="absolute top-7 left-5 z-10">
				<Link to="/login">
					<Button size="lg">Login</Button>
				</Link>

				<Link to="/dashboard">
					<Button size="lg">Dashboard</Button>
				</Link>

				{session && <Button onClick={handleLogout}>Logout</Button>}

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
