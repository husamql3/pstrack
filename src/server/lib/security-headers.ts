import { Elysia } from "elysia"

const CONTENT_SECURITY_POLICY_REPORT_ONLY = [
	"default-src 'self'",
	"base-uri 'self'",
	"object-src 'none'",
	"frame-ancestors 'none'",
	"form-action 'self' https://polar.sh https://*.polar.sh",
	"script-src 'self' 'unsafe-inline'",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob: https:",
	"font-src 'self' data:",
	"connect-src 'self' https://*.sentry.io https://*.posthog.com",
	"worker-src 'self' blob:",
	"manifest-src 'self'",
	"media-src 'none'",
].join("; ")

const SECURITY_HEADERS = {
	"content-security-policy-report-only": CONTENT_SECURITY_POLICY_REPORT_ONLY,
	"permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
	"referrer-policy": "strict-origin-when-cross-origin",
	"x-content-type-options": "nosniff",
	"x-frame-options": "DENY",
}

export const applySecurityHeaders = (headers: Headers) => {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		headers.set(name, value)
	}
}

export const securityHeaders = new Elysia({ name: "security-headers" })
	.onRequest(({ set }) => {
		for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
			set.headers[name] = value
		}
	})
	.as("global")
