import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { env } from "@/env";

// Server function to log env on server
const getServerEnv = createServerFn().handler(async () => {
	console.log("SERVER ENV:", env);
	console.log("SERVER VITE_BACKEND_URL:", env.VITE_BACKEND_URL);
	console.log("SERVER NODE_ENV:", env.NODE_ENV);
	console.log("SERVER DATABASE_URL:", env.DATABASE_URL);
	console.log("SERVER BETTER_AUTH_SECRET:", env.BETTER_AUTH_SECRET ? "***SET***" : "NOT SET");

	// Return sanitized env (don't expose secrets to client)
	return {
		NODE_ENV: env.NODE_ENV,
		VITE_BACKEND_URL: env.VITE_BACKEND_URL,
		VITE_FRONTEND_URL: env.VITE_FRONTEND_URL,
		VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
		BETTER_AUTH_URL: env.BETTER_AUTH_URL,
		// Don't send secrets to client
		hasDatabase: !!env.DATABASE_URL,
		hasBetterAuthSecret: !!env.BETTER_AUTH_SECRET,
		hasGoogleClientSecret: !!env.GOOGLE_CLIENT_SECRET,
	};
});

export const Route = createFileRoute("/")({
	component: App,
	loader: async () => {
		const serverEnv = await getServerEnv();
		return { serverEnv };
	},
});

function App() {
	const { serverEnv } = Route.useLoaderData();

	// Client-side logging
	console.log("CLIENT ENV:", env);
	console.log("CLIENT VITE_BACKEND_URL:", env.VITE_BACKEND_URL);

	return (
		<div className="App">
			<h1>Environment Variables</h1>

			<h2>Server-side (check terminal/logs)</h2>
			<pre>{JSON.stringify(serverEnv, null, 2)}</pre>

			<h2>Client-side (check browser console)</h2>
			<pre>{JSON.stringify(env, null, 2)}</pre>
		</div>
	);
}
