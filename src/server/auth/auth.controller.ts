import { Elysia } from "elysia"

export const authController = new Elysia({ tags: ["Auth"] }).get(
	"/magic-link",
	({ request }) => {
		const { searchParams } = new URL(request.url)
		const token = searchParams.get("token") ?? ""
		const callbackURL = searchParams.get("callbackURL") || "/dashboard"
		const dest = `/api/v3/auth/magic-link/verify?token=${token}&callbackURL=${encodeURIComponent(callbackURL)}`
		return new Response(
			`<!DOCTYPE html><html><head><script>location.replace(${JSON.stringify(dest)})</script></head><body></body></html>`,
			{ headers: { "content-type": "text/html;charset=utf-8" } }
		)
	},
	{ detail: { tags: ["Auth"] } }
)
