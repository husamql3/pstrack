export const USERNAME_PATTERN = "^[a-z0-9_-]{3,30}$"
export const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/
export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30
export const USERNAME_COOLDOWN_DAYS = 30
export const USERNAME_COOLDOWN_MS = USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000

export const RESERVED_USERNAMES = new Set<string>([
	"login",
	"signup",
	"verify-email",
	"forgot-password",
	"reset-password",
	"profile",
	"dashboard",
	"problems",
	"leaderboard",
	"groups",
	"settings",
	"admin",
	"onboarding",
	"api",
	"help",
	"account",
	"billing",
	"notifications",
	"search",
	"explore",
	"feed",
	"inbox",
	"pro",
	"upgrade",
	"pricing",
	"about",
	"contact",
	"privacy",
	"terms",
	"blog",
	"docs",
	"faq",
	"support",
	"security",
	"status",
	"auth",
	"oauth",
	"sso",
	"sign-in",
	"sign-out",
	"signin",
	"signout",
	"app",
	"www",
	"mail",
	"root",
	"me",
	"user",
	"users",
	"group",
	"problem",
])

export type CheckUsernameReason = "taken" | "reserved" | "invalid"

export const isReservedUsername = (username: string): boolean =>
	RESERVED_USERNAMES.has(username.toLowerCase())
