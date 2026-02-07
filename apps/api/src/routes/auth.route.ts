import { auth } from "@/lib/auth";
import { error, success } from "@/lib/response";
import { createRouter } from "@/utils/create-app";

export const authRouter = createRouter()
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
	.get("/me", (c) => {
		const session = c.get("session");
		const user = c.get("user");

		if (!user) return error(c, "Unauthorized", 401);
		return success(
			c,
			{
				session,
				user,
			},
			200,
		);
	})
	.on(["POST", "GET"], "/*", (c) => {
		return auth.handler(c.req.raw);
	});
