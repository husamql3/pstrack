import { FRONTEND_URLS } from "@pstrack/shared/constants";
import * as Sentry from "@sentry/cloudflare";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { auth } from "@/lib/auth";

export type AppType = {
	Bindings: Env;
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
};

export const createRouter = () => {
	return new Hono<AppType>({
		strict: false,
	});
};

export const createApp = () => {
	return createRouter()
		.use("*", logger())
		.use(
			"*",
			cors({
				origin: (origin) => (origin && FRONTEND_URLS.includes(origin) ? origin : FRONTEND_URLS[0]),
				credentials: true,
				allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
				allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
			}),
		)
		.basePath("/api/v3")
		.onError(async (e, c) => {
			// Capture exception in Sentry with additional context
			Sentry.captureException(e, {
				tags: {
					endpoint: c.req.path,
					method: c.req.method,
				},
				extra: {
					headers: Object.fromEntries(c.req.raw.headers),
					url: c.req.url,
				},
			});

			// TODO: Don't expose internal errors in production
			return c.json(
				{
					error: "Internal Server Error",
					message: e.message,
					stack: e.stack,
				},
				500,
			);
		})
		.get("/health", (c) => {
			return c.json({
				status: "ok",
				environment: process.env.NODE_ENV,
				timestamp: new Date().toISOString(),
			});
		})
		.get("/", (c) => {
			return c.json({
				message: "pstrack API v3",
				version: "3.0.0",
			});
		})
		.get("/error", () => {
			throw new Error("This is a test error for Sentry");
		});
};
