import * as Sentry from "@sentry/cloudflare";
import { env as workerEnv } from "cloudflare:workers";
import { Hono } from "hono";

import { getSentryConfig } from "@/config/sentry";

const app = new Hono<{ Bindings: Env }>()
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
			environment: workerEnv.NODE_ENV,
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

export default Sentry.withSentry((env: Env) => getSentryConfig(env), {
	async fetch(request, env, ctx) {
		// Set request-level context to Sentry
		Sentry.setContext("request", {
			url: request.url,
			method: request.method,
			headers: Object.fromEntries(request.headers),
		});

		// Add custom tags for all events
		Sentry.setTags({
			worker: "pstrack-api",
			region: request.cf?.colo as string, // Cloudflare datacenter
			country: request.cf?.country as string,
		});

		return app.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>);
