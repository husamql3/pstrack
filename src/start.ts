import { createMiddleware, createStart } from "@tanstack/react-start"

import { applySecurityHeaders } from "@/server/lib/security-headers"

const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
	const result = await next()
	const headers = new Headers(result.response.headers)
	applySecurityHeaders(headers)

	return {
		...result,
		response: new Response(result.response.body, {
			headers,
			status: result.response.status,
			statusText: result.response.statusText,
		}),
	}
})

export const startInstance = createStart(() => ({
	requestMiddleware: [securityHeadersMiddleware],
}))
