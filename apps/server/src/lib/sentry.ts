import type * as Sentry from "@sentry/cloudflare";

// TODO: Configure Uptime Monitors https://husamql3.sentry.io/insights/uptime/
// TODO: Set Up User Feedback https://docs.sentry.io/platforms/javascript/user-feedback/
// TODO: Use sentry cli

export function getSentryConfig(env: Env): Sentry.CloudflareOptions {
	const isProd = env.NODE_ENV === "production";

	return {
		// Core Configuration
		dsn: env.SENTRY_DSN,
		environment: env.NODE_ENV,

		// Logging
		enableLogs: true,

		// Performance Monitoring
		tracesSampleRate: isProd ? 0.1 : 1.0, // 10% in prod, 100% in dev

		// Privacy & PII
		sendDefaultPii: true, // Includes IP addresses, be mindful of GDPR

		// Error Filtering
		ignoreErrors: [
			// Browser errors that aren't actionable
			"ResizeObserver loop limit exceeded",
			"ResizeObserver loop completed with undelivered notifications",
			// Network errors that are expected
			"NetworkError",
			"Failed to fetch",
			// Known third-party errors
			/^Non-Error promise rejection captured/i,
		],

		// URL filtering (don't send errors from these URLs)
		denyUrls: [
			// Browser extensions
			/extensions\//i,
			/^chrome:\/\//i,
			/^moz-extension:\/\//i,
		],

		// Breadcrumbs (helps understand what led to an error)
		maxBreadcrumbs: 50, // Default is 100

		// Attach stack traces to messages (not just errors)
		attachStacktrace: true,

		// Normalize depth for serializing objects
		normalizeDepth: 5, // Default is 3

		// Maximum value length for serialized values
		maxValueLength: 1000, // Default is 250

		// beforeSend: Modify or filter events before sending
		beforeSend(event, hint) {
			const error = hint.originalException;

			if (error instanceof Error) {
				// Don't send validation errors to Sentry
				if (error.message.includes("Validation failed")) {
					return null;
				}

				// Don't send 404 errors
				if (error.message.includes("Not Found") || error.message.includes("404")) {
					return null;
				}

				// Don't send rate limit errors (these are expected)
				if (error.message.includes("Rate limit exceeded")) {
					return null;
				}
			}

			return event;
		},
	};
}
