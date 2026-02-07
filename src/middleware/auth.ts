import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

import { auth } from "@/auth";

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
	try {
		// Use Better Auth's fromRequest helper to get session from request
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		console.log("Session check:", {
			hasSession: !!session?.session,
			hasUser: !!session?.user,
		});

		// If no session or user, redirect to login
		if (!session?.session || !session?.user) {
			console.log("No valid session, redirecting to login");
			throw redirect({ to: "/login" });
		}

		console.log("Authenticated user:", session.user.email);

		// Pass user and session to route context
		return next({
			context: {
				user: session.user,
				session: session.session,
			},
		});
	} catch (error) {
		// If it's a redirect error, re-throw it
		if (error && typeof error === "object" && "href" in error) {
			throw error;
		}

		console.error("Auth middleware error:", error);
		throw redirect({ to: "/login" });
	}
});
