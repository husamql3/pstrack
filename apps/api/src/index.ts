import "hono";

import { env } from "@/env";
import { success } from "@/lib/response";
import { authRouter } from "@/routes/auth.route";
import { createApp } from "@/utils/create-app";

const app = createApp()
	.get("/", (c) => {
		return success(
			c,
			{
				message: "pstrack API",
				version: "3.0.0",
			},
			200,
		);
	})
	.route("/api/auth", authRouter);

if (env.NODE_ENV === "development") {
	const { serve } = await import("@hono/node-server");
	const server = serve(
		{
			fetch: app.fetch,
			port: env.PORT,
		},
		() => {
			console.log(`Server is running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
		},
	);

	process.on("SIGINT", () => {
		server.close();
		process.exit(0);
	});

	process.on("SIGTERM", () => {
		server.close((err) => {
			if (err) {
				console.error(err);
				process.exit(1);
			}
			process.exit(0);
		});
	});
}

export default app;
