import * as Sentry from "@sentry/cloudflare";

import { getSentryConfig } from "@/lib/sentry";
import { authRoute } from "@/routes/auth.route";
import { createApp } from "@/utils/create-app";

const app = createApp().route("/", authRoute);

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
