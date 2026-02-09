import type { Context, Next } from "hono";

import { error } from "@/lib/response";

export async function adminMiddleware(c: Context, next: Next) {
	const user = c.get("user");
	if (!user || user.role !== "admin") {
		return error(c, "Forbidden", 403);
	}

	return next();
}
