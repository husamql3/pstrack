import { IconBell, IconCreditCard, IconUser, IconUserCircle } from "@tabler/icons-react"

export const SETTINGS_NAV = [
	{ to: "/settings/account", label: "Account", icon: IconUser },
	{ to: "/settings/profile", label: "Profile", icon: IconUserCircle },
	{ to: "/settings/notifications", label: "Notifications", icon: IconBell },
	{ to: "/settings/billing", label: "Billing", icon: IconCreditCard },
] as const

export type SettingsNavItem = (typeof SETTINGS_NAV)[number]
