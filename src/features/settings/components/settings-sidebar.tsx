import { Link, useRouterState } from "@tanstack/react-router"

import { cn } from "@/lib/utils"
import { SETTINGS_NAV } from "../constants"

export const SettingsSidebar = () => {
	const pathname = useRouterState({ select: (s) => s.location.pathname })

	return (
		<nav className="flex w-56 shrink-0 flex-col gap-0.5 pt-1">
			{SETTINGS_NAV.map(({ to, label, icon: Icon }) => {
				const isActive = pathname.startsWith(to)
				return (
					<Link
						key={to}
						to={to}
						className={cn(
							"flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
							isActive
								? "bg-accent text-foreground"
								: "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
						)}
					>
						<Icon className="size-4" aria-hidden="true" />
						{label}
					</Link>
				)
			})}
		</nav>
	)
}
