import type { MiddlewareHandler } from "hono";
// import { getConnInfo } from "hono/cloudflare-workers";

export function logger(): MiddlewareHandler {
	return async (c, next) => {
		const start = Date.now();
		const method = c.req.method;
		const path = c.req.path;

		// let ip = "unknown";
		// try {
		//   const info = getConnInfo(c);
		//   ip = info.remote.address || "unknown";
		// } catch {
		//   ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
		// }

		// Color codes
		const colors = {
			reset: "\x1b[0m",
			method: "\x1b[36m", // Cyan
			path: "\x1b[37m", // White
			arrow: "\x1b[34m", // Blue
			status: {
				success: "\x1b[32m", // Green (2xx)
				redirect: "\x1b[33m", // Yellow (3xx)
				clientError: "\x1b[31m", // Red (4xx)
				serverError: "\x1b[35m", // Magenta (5xx)
			},
			duration: "\x1b[90m", // Gray
			timestamp: "\x1b[90m", // Gray
		};

		const timestamp = new Date().toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			fractionalSecondDigits: 3,
			hour12: true,
		});

		// Log incoming request
		console.log(
			`${colors.arrow}<--${colors.reset} ${colors.timestamp}[${timestamp}]${colors.reset} ${colors.method}${method}${colors.reset} ${colors.path}${path}${colors.reset}`,
		);

		await next();

		const duration = Date.now() - start;
		const status = c.res.status;

		// Determine status color
		let statusColor = colors.status.success;
		if (status >= 500) statusColor = colors.status.serverError;
		else if (status >= 400) statusColor = colors.status.clientError;
		else if (status >= 300) statusColor = colors.status.redirect;

		// Log outgoing response
		console.log(
			`${colors.arrow}-->${colors.reset} ${colors.timestamp}[${timestamp}]${colors.reset} ${colors.method}${method}${colors.reset} ${colors.path}${path}${colors.reset} ${statusColor}${status}${colors.reset} ${colors.duration}${duration}ms${colors.reset}`,
		);
	};
}
