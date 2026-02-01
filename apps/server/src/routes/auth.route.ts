import { auth } from "@/lib/auth";
import { createRouter } from "@/utils/create-app";

export const authRoute = createRouter()
	.basePath("/auth")
	.use("*", async (c, next) => {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session) {
			c.set("user", null);
			c.set("session", null);
			return next();
		}

		c.set("user", session.user);
		c.set("session", session.session);
		return next();
	})
	.get("/session", (c) => {
		const session = c.get("session");
		const user = c.get("user");

		if (!user) return c.body(null, 401);
		return c.json({
			session,
			user,
		});
	})
	.on(["POST", "GET"], "/*", (c) => {
		return auth.handler(c.req.raw);
	});
