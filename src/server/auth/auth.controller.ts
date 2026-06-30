import { Elysia } from "elysia"

export const authController = new Elysia({ tags: ["Auth"] }).get(
	"/magic-link",
	({ request }) => {
		const { searchParams } = new URL(request.url)
		const token = searchParams.get("token") ?? ""
		const rawCallback = searchParams.get("callbackURL") ?? ""
		// Reject absolute URLs and protocol-relative URLs; only allow relative paths.
		const callbackURL =
			rawCallback.startsWith("/") && !rawCallback.startsWith("//")
				? rawCallback
				: "/dashboard"
		const dest = `/api/v3/auth/magic-link/verify?token=${token}&callbackURL=${encodeURIComponent(callbackURL)}`
		// HTML-escape < and > so </script> in any param value cannot break out of the script tag.
		const safeJson = JSON.stringify(dest)
			.replace(/</g, "\\u003c")
			.replace(/>/g, "\\u003e")
		return new Response(
			`<!DOCTYPE html><html><head><script>location.replace(${safeJson})</script></head><body></body></html>`,
			{ headers: { "content-type": "text/html;charset=utf-8" } }
		)
	},
	{ detail: { tags: ["Auth"] } }
)
