export type CspBlockedResource =
	| "blob"
	| "data"
	| "eval"
	| "http-external"
	| "https-external"
	| "inline"
	| "other"
	| "polar"
	| "posthog"
	| "self"
	| "sentry"
	| "unknown"

export type CspDocumentArea =
	| "admin"
	| "api"
	| "app"
	| "auth"
	| "profile"
	| "settings"
	| "unknown"

export type CspViolationSummary = {
	blockedResource: CspBlockedResource
	disposition: "enforce" | "report" | "unknown"
	documentArea: CspDocumentArea
	effectiveDirective: string
}
