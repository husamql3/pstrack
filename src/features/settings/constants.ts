import { IconBell, IconSparkles, IconUser, IconUserCircle } from "@tabler/icons-react"

export const SETTINGS_NAV = [
	{ to: "/settings/account", label: "Account", icon: IconUser },
	{ to: "/settings/profile", label: "Profile", icon: IconUserCircle },
	{ to: "/settings/notifications", label: "Notifications", icon: IconBell },
	{ to: "/settings/plan", label: "Plan", icon: IconSparkles },
] as const

export type SettingsNavItem = (typeof SETTINGS_NAV)[number]

// ─── Pro plan ─────────────────────────────────────────────────────────────
// Pro is a one-time LIFETIME unlock — not a subscription. See docs/FREEMIUM_MODEL.md.

/** Displayed price. The amount actually charged is set on the Polar product. */
export const PRO_PRICE_LABEL = "$5"
export const PRO_PRICE_CAPTION = "one-time · lifetime"

/** Polar product slug — must match the checkout() slug in src/server/lib/auth.ts. */
export const PRO_CHECKOUT_SLUG = "pstrack"

/** What upgrading unlocks — mirrors the tier table in AGENTS.md. */
export const PRO_FEATURES = [
	"Join up to 5 groups (Free: 1)",
	"Create private, invite-only groups",
	"4 pauses per month (Free: 2)",
	"Global leaderboard — top 100 worldwide",
	"Pro badge on your profile",
] as const
