import {
	IconChartFunnel,
	IconChartPie,
	IconGitBranch,
	IconLayoutDashboard,
	IconPlug,
	IconPointer,
	IconRepeat,
	IconUser,
	IconUsersGroup,
} from "@tabler/icons-react"
import type { ReactNode } from "react"

export type SidebarNavItem = {
	title: string
	path?: string
	icon?: ReactNode
	isActive?: boolean
	subItems?: SidebarNavItem[]
}

export type SidebarNavGroup = {
	label: string
	items: SidebarNavItem[]
}

export const navGroups: SidebarNavGroup[] = [
	{
		label: "Explore",
		items: [
			{
				title: "Dashboard",
				path: "#/overview",
				icon: <IconLayoutDashboard />,
				isActive: true,
			},
			{
				title: "Events",
				path: "#/events",
				icon: <IconPointer />,
			},
			{
				title: "Funnels",
				path: "#/funnels",
				icon: <IconChartFunnel />,
			},
			{
				title: "Retention",
				path: "#/retention",
				icon: <IconRepeat />,
			},
			{
				title: "Flows",
				path: "#/flows",
				icon: <IconGitBranch />,
			},
		],
	},
	{
		label: "Audiences",
		items: [
			{
				title: "Segments",
				path: "#/segments",
				icon: <IconUsersGroup />,
			},
			{
				title: "Cohorts",
				path: "#/cohorts",
				icon: <IconChartPie />,
			},
			{
				title: "Profiles",
				path: "#/profiles",
				icon: <IconUser />,
			},
		],
	},
	{
		label: "Configure",
		items: [
			{
				title: "Integrations",
				path: "#/integrations",
				icon: <IconPlug />,
			},
		],
	},
]

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item]
		)
	),
]
