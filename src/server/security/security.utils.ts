import type {
	CspBlockedResource,
	CspDocumentArea,
	CspViolationSummary,
} from "./security.type"

const CSP_DIRECTIVES = new Set([
	"base-uri",
	"connect-src",
	"default-src",
	"font-src",
	"form-action",
	"frame-ancestors",
	"img-src",
	"manifest-src",
	"media-src",
	"object-src",
	"script-src",
	"script-src-attr",
	"script-src-elem",
	"style-src",
	"style-src-attr",
	"style-src-elem",
	"worker-src",
])

const readString = (value: unknown, key: string) => {
	if (!value || typeof value !== "object") return undefined
	const field = Reflect.get(value, key)
	return typeof field === "string" ? field : undefined
}

const normalizeDirective = (value: unknown) => {
	if (typeof value !== "string") return "unknown"
	return CSP_DIRECTIVES.has(value) ? value : "unknown"
}

const categorizeDocumentArea = (value: unknown): CspDocumentArea => {
	if (typeof value !== "string") return "unknown"
	try {
		const path = new URL(value).pathname
		if (path === "/admin" || path.startsWith("/admin/")) return "admin"
		if (path === "/login" || path === "/signup") return "auth"
		if (path === "/profile" || path.startsWith("/profile/")) return "profile"
		if (path === "/settings" || path.startsWith("/settings/")) return "settings"
		if (path === "/api" || path.startsWith("/api/")) return "api"
		return "app"
	} catch {
		return "unknown"
	}
}

const categorizeBlockedResource = (value: unknown): CspBlockedResource => {
	if (value === "inline" || value === "eval" || value === "self") return value
	if (value === "data" || value === "blob") return value
	if (typeof value !== "string") return "unknown"
	try {
		const url = new URL(value)
		if (url.hostname.endsWith(".sentry.io")) return "sentry"
		if (url.hostname.endsWith(".posthog.com")) return "posthog"
		if (url.hostname === "polar.sh" || url.hostname.endsWith(".polar.sh")) {
			return "polar"
		}
		if (url.protocol === "https:") return "https-external"
		if (url.protocol === "http:") return "http-external"
		return "other"
	} catch {
		return "other"
	}
}

export const summarizeCspViolation = (
	value: unknown
): CspViolationSummary | undefined => {
	if (!value || typeof value !== "object") return undefined
	const legacyReport = Reflect.get(value, "csp-report")
	const modernReport = Reflect.get(value, "body")
	const report = legacyReport ?? modernReport ?? value
	if (!report || typeof report !== "object") return undefined

	const disposition = readString(report, "disposition")
	return {
		blockedResource: categorizeBlockedResource(
			readString(report, "blocked-uri") ?? readString(report, "blockedURL")
		),
		disposition:
			disposition === "report" || disposition === "enforce" ? disposition : "unknown",
		documentArea: categorizeDocumentArea(
			readString(report, "document-uri") ?? readString(report, "documentURL")
		),
		effectiveDirective: normalizeDirective(
			readString(report, "effective-directive") ??
				readString(report, "effectiveDirective")
		),
	}
}
