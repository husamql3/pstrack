import {
	IconAdjustmentsHorizontal,
	IconBook,
	IconDashboard,
	IconFlag,
	IconHistory,
	IconMail,
	IconSettings,
	IconUsers,
	IconUsersGroup,
} from "@tabler/icons-react"
import type { ReactNode } from "react"

export type AdminNavItem = {
	title: string
	path:
		| "/admin"
		| "/admin/users"
		| "/admin/groups"
		| "/admin/problems"
		| "/admin/audit"
		| "/admin/flags"
		| "/admin/config"
		| "/admin/emails"
	icon: ReactNode
}

export type AdminNavGroup = {
	label: string
	items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavGroup[] = [
	{
		label: "Overview",
		items: [
			{ title: "Dashboard", path: "/admin", icon: <IconDashboard className="size-4" /> },
			{
				title: "Audit log",
				path: "/admin/audit",
				icon: <IconHistory className="size-4" />,
			},
		],
	},
	{
		label: "Entities",
		items: [
			{ title: "Users", path: "/admin/users", icon: <IconUsers className="size-4" /> },
			{
				title: "Groups",
				path: "/admin/groups",
				icon: <IconUsersGroup className="size-4" />,
			},
			{
				title: "Problems",
				path: "/admin/problems",
				icon: <IconBook className="size-4" />,
			},
		],
	},
	{
		label: "Platform",
		items: [
			{
				title: "Feature flags",
				path: "/admin/flags",
				icon: <IconFlag className="size-4" />,
			},
			{
				title: "System config",
				path: "/admin/config",
				icon: <IconAdjustmentsHorizontal className="size-4" />,
			},
			{ title: "Emails", path: "/admin/emails", icon: <IconMail className="size-4" /> },
		],
	},
]

export const ADMIN_NAV_FLAT: AdminNavItem[] = ADMIN_NAV.flatMap((g) => g.items)

export { IconSettings }
