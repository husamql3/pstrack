import { Link, useRouterState } from "@tanstack/react-router"

import { ThemeSwitcher } from "@/components/theme-switcher"
import { Button } from "@/components/ui/button"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { ADMIN_NAV } from "./admin-nav"

export function AdminSidebar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname })

	return (
		<Sidebar
			className={cn("*:data-[slot=sidebar-inner]:bg-background")}
			collapsible="icon"
			variant="sidebar"
		>
			<SidebarHeader className="h-(--app-header-height,3rem) flex-row items-center gap-2 px-3">
				<Button asChild size="icon-sm" variant="ghost">
					<Link to="/dashboard">
						<img src="/logo-light.png" alt="PSTrack" className="size-4" />
					</Link>
				</Button>
				<div className="flex flex-col leading-tight">
					<span className="font-semibold text-xs tracking-tight">PStrack</span>
					<span className="text-[10px] text-muted-foreground uppercase tracking-wider">
						Admin
					</span>
				</div>
			</SidebarHeader>

			<SidebarContent>
				{ADMIN_NAV.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">
							{group.label}
						</SidebarGroupLabel>
						<SidebarMenu>
							{group.items.map((item) => {
								const isActive =
									item.path === "/admin"
										? pathname === "/admin" || pathname === "/admin/"
										: pathname.startsWith(item.path)
								return (
									<SidebarMenuItem key={item.path}>
										<SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
											<Link to={item.path}>
												{item.icon}
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)
							})}
						</SidebarMenu>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarFooter className="border-t px-3 py-2">
				<div className="flex items-center justify-between">
					<ThemeSwitcher />
					<Button asChild size="sm" variant="ghost">
						<Link to="/dashboard">Exit admin</Link>
					</Button>
				</div>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
