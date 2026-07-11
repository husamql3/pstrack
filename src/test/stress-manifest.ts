export type StressDimension =
	| "auth"
	| "authorization"
	| "concurrency"
	| "fuzz"
	| "idempotency"
	| "invariant"
	| "load"
	| "read"
	| "side-effect"

export type StressEndpoint = {
	method: string
	path: string
	module: string
	dimensions: StressDimension[]
}

export type StressBackgroundModule = {
	file: string
	module: string
	dimensions: StressDimension[]
}

export const STRESS_ENDPOINTS: StressEndpoint[] = [
	{ method: "ALL", path: "/api/v3/auth/*", module: "auth", dimensions: ["auth"] },
	{
		method: "GET",
		path: "/api/v3/health",
		module: "health",
		dimensions: ["read", "load"],
	},
	{ method: "GET", path: "/api/v3/openapi", module: "docs", dimensions: ["read"] },
	{ method: "GET", path: "/api/v3/openapi/json", module: "docs", dimensions: ["read"] },
	{ method: "GET", path: "/api/v3/og/", module: "og", dimensions: ["read", "fuzz"] },
	{
		method: "GET",
		path: "/api/v3/magic-link",
		module: "auth",
		dimensions: ["auth", "fuzz"],
	},
	{
		method: "POST",
		path: "/api/v3/users/check-username",
		module: "users",
		dimensions: ["fuzz", "load"],
	},
	{
		method: "POST",
		path: "/api/v3/users/validate-leetcode",
		module: "users",
		dimensions: ["fuzz", "load"],
	},
	{
		method: "POST",
		path: "/api/v3/users/validate-codeforces",
		module: "users",
		dimensions: ["fuzz", "load"],
	},
	{
		method: "GET",
		path: "/api/v3/users/count",
		module: "users",
		dimensions: ["read", "load"],
	},
	{
		method: "GET",
		path: "/api/v3/users/me",
		module: "users",
		dimensions: ["auth", "read"],
	},
	{
		method: "PATCH",
		path: "/api/v3/users/me/username",
		module: "users",
		dimensions: ["auth", "fuzz", "side-effect"],
	},
	{
		method: "PATCH",
		path: "/api/v3/users/me/profile",
		module: "users",
		dimensions: ["auth", "fuzz", "side-effect"],
	},
	{
		method: "PATCH",
		path: "/api/v3/users/me/handles",
		module: "users",
		dimensions: ["auth", "fuzz", "side-effect"],
	},
	{
		method: "PATCH",
		path: "/api/v3/users/me/notifications",
		module: "users",
		dimensions: ["auth", "side-effect"],
	},
	{
		method: "GET",
		path: "/api/v3/users/me/sessions",
		module: "users",
		dimensions: ["auth", "read"],
	},
	{
		method: "DELETE",
		path: "/api/v3/users/me/sessions/others",
		module: "users",
		dimensions: ["auth", "side-effect"],
	},
	{
		method: "DELETE",
		path: "/api/v3/users/me/sessions/:id",
		module: "users",
		dimensions: ["auth", "side-effect"],
	},
	{
		method: "GET",
		path: "/api/v3/users/:username",
		module: "users",
		dimensions: ["read", "fuzz"],
	},
	{
		method: "GET",
		path: "/api/v3/users/:username/heatmap",
		module: "users",
		dimensions: ["read", "fuzz"],
	},
	{
		method: "POST",
		path: "/api/v3/groups/join-by-invite",
		module: "groups",
		dimensions: ["auth", "concurrency", "invariant"],
	},
	{
		method: "GET",
		path: "/api/v3/groups/",
		module: "groups",
		dimensions: ["read", "load"],
	},
	{
		method: "POST",
		path: "/api/v3/groups/",
		module: "groups",
		dimensions: ["auth", "side-effect", "invariant"],
	},
	{
		method: "GET",
		path: "/api/v3/groups/:id",
		module: "groups",
		dimensions: ["read", "authorization"],
	},
	{
		method: "POST",
		path: "/api/v3/groups/:id/join",
		module: "groups",
		dimensions: ["auth", "concurrency", "invariant"],
	},
	{
		method: "POST",
		path: "/api/v3/groups/:id/leave",
		module: "groups",
		dimensions: ["auth", "idempotency", "invariant"],
	},
	{
		method: "GET",
		path: "/api/v3/groups/:id/members",
		module: "groups",
		dimensions: ["read", "load"],
	},
	{
		method: "GET",
		path: "/api/v3/groups/:id/today-activity",
		module: "groups",
		dimensions: ["auth", "authorization", "read"],
	},
	{
		method: "GET",
		path: "/api/v3/groups/:id/problems",
		module: "groups",
		dimensions: ["authorization", "read", "load"],
	},
	{
		method: "GET",
		path: "/api/v3/problems/today",
		module: "problems",
		dimensions: ["auth", "idempotency", "invariant"],
	},
	{
		method: "GET",
		path: "/api/v3/problems/roadmap",
		module: "problems",
		dimensions: ["read", "fuzz", "load"],
	},
	{
		method: "POST",
		path: "/api/v3/problems/today/solve",
		module: "problems",
		dimensions: ["auth", "concurrency", "idempotency", "invariant"],
	},
	{
		method: "POST",
		path: "/api/v3/problems/today/pause",
		module: "problems",
		dimensions: ["auth", "concurrency", "idempotency", "invariant"],
	},
	{
		method: "GET",
		path: "/api/v3/badges/me",
		module: "badges",
		dimensions: ["auth", "read", "invariant"],
	},
	{
		method: "GET",
		path: "/api/v3/feedbacks/prompt",
		module: "feedback",
		dimensions: ["auth", "read"],
	},
	{
		method: "POST",
		path: "/api/v3/feedbacks/",
		module: "feedback",
		dimensions: ["auth", "idempotency", "invariant"],
	},
	{
		method: "POST",
		path: "/api/v3/feedbacks/general",
		module: "feedback",
		dimensions: ["auth", "side-effect"],
	},
	{
		method: "GET",
		path: "/api/v3/feedbacks/",
		module: "feedback",
		dimensions: ["authorization", "read"],
	},
	{
		method: "PATCH",
		path: "/api/v3/feedbacks/:id/reviewed",
		module: "feedback",
		dimensions: ["authorization", "side-effect"],
	},
	{
		method: "PATCH",
		path: "/api/v3/internal/bot/join-requests/:requestId",
		module: "internal",
		dimensions: ["auth", "side-effect", "invariant"],
	},
	{
		method: "POST",
		path: "/api/v3/internal/bot/join-requests/:requestId/transfer",
		module: "internal",
		dimensions: ["auth", "side-effect", "invariant"],
	},
	{
		method: "GET",
		path: "/api/v3/internal/bot/groups",
		module: "internal",
		dimensions: ["auth", "read"],
	},
	{
		method: "GET",
		path: "/api/v3/internal/bot/join-requests",
		module: "internal",
		dimensions: ["auth", "read"],
	},
	{
		method: "GET",
		path: "/api/v3/internal/bot",
		module: "internal",
		dimensions: ["auth", "read"],
	},
	{
		method: "POST",
		path: "/api/v3/internal/jobs/:jobName",
		module: "jobs",
		dimensions: ["auth", "idempotency", "side-effect"],
	},
	{
		method: "GET",
		path: "/api/v3/internal/jobs/freshness",
		module: "jobs",
		dimensions: ["auth", "read"],
	},
	{
		method: "GET",
		path: "/api/v3/leaderboard/global",
		module: "leaderboard",
		dimensions: ["auth", "authorization", "read", "load"],
	},
	{
		method: "GET",
		path: "/api/v3/leaderboard/groups/:id",
		module: "leaderboard",
		dimensions: ["read", "load"],
	},
	{
		method: "GET",
		path: "/api/v3/leaderboard/my-groups",
		module: "leaderboard",
		dimensions: ["auth", "read"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/stats",
		module: "admin",
		dimensions: ["authorization", "read"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/audit",
		module: "admin",
		dimensions: ["authorization", "read", "fuzz"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/feature-flags",
		module: "admin",
		dimensions: ["authorization", "read"],
	},
	{
		method: "POST",
		path: "/api/v3/admin/feature-flags",
		module: "admin",
		dimensions: ["authorization", "side-effect", "idempotency"],
	},
	{
		method: "PATCH",
		path: "/api/v3/admin/feature-flags/:key",
		module: "admin",
		dimensions: ["authorization", "side-effect"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/system-config",
		module: "admin",
		dimensions: ["authorization", "read"],
	},
	{
		method: "PUT",
		path: "/api/v3/admin/system-config",
		module: "admin",
		dimensions: ["authorization", "side-effect", "idempotency"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/emails/templates",
		module: "admin",
		dimensions: ["authorization", "read"],
	},
	{
		method: "POST",
		path: "/api/v3/admin/emails/send",
		module: "admin",
		dimensions: ["authorization", "side-effect"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/users/",
		module: "admin-users",
		dimensions: ["authorization", "read", "fuzz"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/users/:id",
		module: "admin-users",
		dimensions: ["authorization", "read"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/users/:id/points-history",
		module: "admin-users",
		dimensions: ["authorization", "read"],
	},
	{
		method: "PATCH",
		path: "/api/v3/admin/users/:id/ban",
		module: "admin-users",
		dimensions: ["authorization", "side-effect"],
	},
	{
		method: "POST",
		path: "/api/v3/admin/users/:id/points",
		module: "admin-users",
		dimensions: ["authorization", "side-effect", "invariant"],
	},
	{
		method: "POST",
		path: "/api/v3/admin/users/:id/pro",
		module: "admin-users",
		dimensions: ["authorization", "side-effect"],
	},
	{
		method: "POST",
		path: "/api/v3/admin/users/:id/impersonate-audit",
		module: "admin-users",
		dimensions: ["authorization", "side-effect"],
	},
	{
		method: "POST",
		path: "/api/v3/admin/users/:id/impersonate-end-audit",
		module: "admin-users",
		dimensions: ["authorization", "side-effect"],
	},
	{
		method: "POST",
		path: "/api/v3/admin/groups/",
		module: "admin-groups",
		dimensions: ["authorization", "side-effect", "invariant"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/groups/",
		module: "admin-groups",
		dimensions: ["authorization", "read", "fuzz"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/groups/pending-requests",
		module: "admin-groups",
		dimensions: ["authorization", "read"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/groups/:id",
		module: "admin-groups",
		dimensions: ["authorization", "read"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/groups/:id/members",
		module: "admin-groups",
		dimensions: ["authorization", "read"],
	},
	{
		method: "DELETE",
		path: "/api/v3/admin/groups/:id/members/:userId",
		module: "admin-groups",
		dimensions: ["authorization", "side-effect", "invariant"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/groups/:id/join-requests",
		module: "admin-groups",
		dimensions: ["authorization", "read"],
	},
	{
		method: "PATCH",
		path: "/api/v3/admin/groups/:id/join-requests/:requestId",
		module: "admin-groups",
		dimensions: ["authorization", "side-effect", "invariant"],
	},
	{
		method: "POST",
		path: "/api/v3/admin/groups/:id/invite",
		module: "admin-groups",
		dimensions: ["authorization", "side-effect"],
	},
	{
		method: "DELETE",
		path: "/api/v3/admin/groups/:id/invite",
		module: "admin-groups",
		dimensions: ["authorization", "side-effect"],
	},
	{
		method: "PATCH",
		path: "/api/v3/admin/groups/:id/start",
		module: "admin-groups",
		dimensions: ["authorization", "side-effect", "idempotency"],
	},
	{
		method: "PATCH",
		path: "/api/v3/admin/groups/:id/freeze",
		module: "admin-groups",
		dimensions: ["authorization", "side-effect"],
	},
	{
		method: "DELETE",
		path: "/api/v3/admin/groups/:id",
		module: "admin-groups",
		dimensions: ["authorization", "side-effect", "invariant"],
	},
	{
		method: "GET",
		path: "/api/v3/admin/problems/",
		module: "admin-problems",
		dimensions: ["authorization", "read", "fuzz"],
	},
	{
		method: "POST",
		path: "/api/v3/admin/problems/",
		module: "admin-problems",
		dimensions: ["authorization", "side-effect", "idempotency"],
	},
	{
		method: "PATCH",
		path: "/api/v3/admin/problems/:id",
		module: "admin-problems",
		dimensions: ["authorization", "side-effect"],
	},
	{
		method: "DELETE",
		path: "/api/v3/admin/problems/:id",
		module: "admin-problems",
		dimensions: ["authorization", "side-effect", "invariant"],
	},
	{
		method: "POST",
		path: "/api/v3/admin/problems/seed",
		module: "admin-problems",
		dimensions: ["authorization", "side-effect", "idempotency"],
	},
]

export const STRESS_BACKGROUND_MODULES: StressBackgroundModule[] = [
	{
		file: "assign-daily-problem.ts",
		module: "trigger",
		dimensions: ["idempotency", "invariant", "side-effect"],
	},
	{
		file: "dispatch-job.ts",
		module: "trigger",
		dimensions: ["side-effect"],
	},
	{
		file: "expire-admin-pro-grants.ts",
		module: "trigger",
		dimensions: ["idempotency", "side-effect"],
	},
	{
		file: "expire-join-requests.ts",
		module: "trigger",
		dimensions: ["idempotency", "side-effect"],
	},
	{
		file: "mark-missed.ts",
		module: "trigger",
		dimensions: ["idempotency", "invariant", "side-effect"],
	},
	{
		file: "purge-system-events.ts",
		module: "trigger",
		dimensions: ["idempotency", "side-effect"],
	},
	{
		file: "reset-monthly-counters.ts",
		module: "trigger",
		dimensions: ["idempotency", "side-effect"],
	},
	{
		file: "reset-today-problems.ts",
		module: "trigger",
		dimensions: ["idempotency", "side-effect"],
	},
	{
		file: "send-weekly-digest.ts",
		module: "trigger",
		dimensions: ["read", "side-effect"],
	},
]
