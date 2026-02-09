import { serve } from "@hono/node-server";
import { sentry } from "@hono/sentry";
import { HTTPException } from "hono/http-exception";

import { env } from "@/env";
import { checkDatabaseConnection } from "@/lib/db-health";
import { success } from "@/lib/response";
import { getSentryConfig } from "@/lib/sentry";
import { authRouter } from "@/routes";
import { createApp } from "@/utils/create-app";

export const app = createApp()
	.get("/", async (c) => {
		const dbHealth = await checkDatabaseConnection();
		return success(
			c,
			{
				message: "pstrack API",
				version: "3.0.0",
				status: "ok",
				db: dbHealth ? "ok" : "error",
				environment: process.env.NODE_ENV,
			},
			200,
		);
	})
	.use("*", sentry(getSentryConfig()))
	.route("/api/auth", authRouter)
	.get("/error", () => {
		throw new HTTPException(500, { message: "Internal Server Error" });
	});

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
