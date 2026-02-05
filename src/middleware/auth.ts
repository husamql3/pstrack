import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "@/auth";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });
	console.log("SESSION:", session);
	if (!session) {
		throw redirect({ to: "/login" });
	}
	console.log("SESSION:", session);

	return next();
});
