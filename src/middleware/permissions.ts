// middleware/permissions.ts
import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

export const adminMiddleware = createMiddleware().server(async ({ next, context }) => {
	const { user } = context;

	if (user.role !== "admin") {
		throw redirect({ to: "/dashboard" });
	}

	// Add more context
	return next({
		context: {
			...context,
			isAdmin: true,
		},
	});
});
