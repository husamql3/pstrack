import { createFileRoute, useRouter } from "@tanstack/react-router";

import { authClient } from "@/auth/auth-client";

// Server function to log env on server
// const getServerEnv = createServerFn().handler(async () => {
// 	console.log("SERVER ENV:", env);

// 	return {
// 		NODE_ENV: env.NODE_ENV,
// 		VITE_BACKEND_URL: env.VITE_BACKEND_URL,
// 		VITE_FRONTEND_URL: env.VITE_FRONTEND_URL,
// 		VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
// 		BETTER_AUTH_URL: env.BETTER_AUTH_URL,
// 		// Don't send secrets to client
// 		hasDatabase: !!env.DATABASE_URL,
// 		hasBetterAuthSecret: !!env.BETTER_AUTH_SECRET,
// 		hasGoogleClientSecret: !!env.GOOGLE_CLIENT_SECRET,
// 	};
// });

export const Route = createFileRoute("/")({
	component: App,
	loader: async () => {
		const session = await authClient.getSession();
		console.log("LOADER SESSION:", session);
		if (!session?.data) {
			return { user: null, isAuthenticated: false };
		}
		console.log("LOADER SESSION:", session);
		return { user: session.data.user, session: session.data, isAuthenticated: true };
	},
	notFoundComponent: () => <div>Not Found</div>,
	errorComponent: () => <div>Error</div>,
	pendingComponent: () => <div>Loading...</div>,
});

function App() {
	const router = useRouter();
	const { user, session, isAuthenticated } = Route.useLoaderData();

	const handleSignIn = async (provider: "google" | "github") => {
		await authClient.signIn.social({ provider });
		router.navigate({ to: "/dashboard" });
	};

	return (
		<div className="App">
			{isAuthenticated ? (
				<div>
					<h1>Welcome, {user?.name}</h1>
					<p>Session: {JSON.stringify(session, null, 2)}</p>
				</div>
			) : (
				<div>
					<h1>Please login</h1>
					<button onClick={() => handleSignIn("google")}>Login with Google</button>
					<button onClick={() => handleSignIn("github")}>Login with Github</button>
				</div>
			)}
		</div>
	);
}
