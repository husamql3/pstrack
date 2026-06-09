import { IconShieldHalfFilled } from "@tabler/icons-react"
import { Link, useRouterState } from "@tanstack/react-router"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserMenu } from "@/components/user-menu"
import { ADMIN_NAV_FLAT } from "./admin-nav"

export function AdminHeader() {
	const pathname = useRouterState({ select: (s) => s.location.pathname })
	const active = ADMIN_NAV_FLAT.find((item) =>
		item.path === "/admin"
			? pathname === "/admin" || pathname === "/admin/"
			: pathname.startsWith(item.path)
	)

	return (
		<header className="sticky top-0 z-40 flex h-(--app-header-height,3rem) w-full shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
			<div className="flex items-center gap-3">
				<SidebarTrigger />
				<div className="flex items-center gap-2 text-sm">
					<IconShieldHalfFilled className="size-4 text-primary" />
					<Link
						to="/admin"
						className="font-medium text-muted-foreground hover:text-foreground"
					>
						Admin
					</Link>
					{active && active.path !== "/admin" ? (
						<>
							<span className="text-muted-foreground">/</span>
							<span className="text-foreground">{active.title}</span>
						</>
					) : null}
				</div>
			</div>
			<div className="flex items-center gap-3">
				<UserMenu />
			</div>
		</header>
	)
}
