import {
	IconCode,
	IconFlame,
	IconHome,
	IconMedal,
	IconTrophy,
	IconUsers,
} from "@tabler/icons-react"
import { Link, useRouterState } from "@tanstack/react-router"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/lib/auth-client"
import { UserMenu } from "./user-menu"

const NAV_LINKS = [
	{ to: "/dashboard", label: "Dashboard", icon: IconHome },
	{ to: "/problems", label: "Problems", icon: IconCode },
	{ to: "/groups", label: "Groups", icon: IconUsers },
	{ to: "/leaderboard", label: "Leaderboard", icon: IconTrophy },
	{ to: "/badges", label: "Badges", icon: IconMedal },
] as const

export function AppHeader() {
	// Select only the pathname — a bare useRouterState() subscribes to every
	// router state tick and re-renders the header throughout each transition.
	const pathname = useRouterState({ select: (s) => s.location.pathname })
	const { data: session } = useSession()
	const isLoggedIn = !!session?.user

	const visibleLinks = isLoggedIn
		? NAV_LINKS
		: NAV_LINKS.filter((l) => l.to !== "/dashboard")
	const activeIndex = visibleLinks.findIndex(({ to }) => pathname.startsWith(to))

	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
	const [hoverStyle, setHoverStyle] = useState({})
	const [activeStyle, setActiveStyle] = useState({ left: "0px", width: "0px" })
	const tabRefs = useRef<(HTMLDivElement | null)[]>([])

	useEffect(() => {
		if (hoveredIndex !== null) {
			const el = tabRefs.current[hoveredIndex]
			if (el) setHoverStyle({ left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` })
		}
	}, [hoveredIndex])

	// Measure BEFORE paint: the header remounts on most navigations, and a
	// post-paint effect lets the browser paint the initial left:0/width:0
	// state first — transition-all then visibly slides the underline in from
	// the far left (#231). With useLayoutEffect the first painted frame is
	// already at the active tab, so only real tab-to-tab changes animate.
	useLayoutEffect(() => {
		const el = tabRefs.current[activeIndex]
		if (el) {
			setActiveStyle({ left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` })
		}
	}, [activeIndex])

	return (
		<header className="sticky top-0 border-border/50 border-b bg-background backdrop-blur-sm">
			<div className="mx-auto flex h-14 items-center gap-8 px-4">
				<Link to="/" className="flex items-center gap-2">
					<img
						src="/logo-dark.png"
						alt="pstrack"
						className="hidden h-5 select-none dark:block"
					/>
					<img
						src="/logo-light.png"
						alt="pstrack"
						className="h-5 select-none dark:hidden"
					/>
				</Link>

				<nav className="relative flex items-center">
					{/* Hover highlight */}
					<div
						className="absolute h-[30px] rounded-[6px] bg-white/10 transition-all duration-300 ease-out"
						style={{
							...hoverStyle,
							opacity: hoveredIndex !== null ? 1 : 0,
						}}
					/>

					{/* Active underline */}
					{activeIndex >= 0 && (
						<div
							className="absolute bottom-[-14px] h-[2px] rounded-full bg-primary transition-all duration-300 ease-out"
							style={activeStyle}
						/>
					)}

					{/* Nav items */}
					<div className="relative flex items-center gap-1">
						{visibleLinks.map(({ to, label, icon: Icon }, index) => (
							// biome-ignore lint/a11y/noStaticElementInteractions: hover tracking for tab indicator animation
							<div
								key={to}
								ref={(el) => {
									if (el) tabRefs.current[index] = el
								}}
								onMouseEnter={() => setHoveredIndex(index)}
								onMouseLeave={() => setHoveredIndex(null)}
							>
								<Link
									to={to}
									className={[
										"flex h-[30px] items-center gap-2 px-3 text-sm transition-colors duration-300",
										index === activeIndex
											? "text-foreground"
											: "text-muted-foreground hover:text-foreground",
									].join(" ")}
								>
									<Icon className="size-4" />
									{label}
								</Link>
							</div>
						))}
					</div>
				</nav>

				<div className="ml-auto flex items-center gap-3">
					<UserStats />
					<UserMenu />
				</div>
			</div>
		</header>
	)
}

const UserStats = () => {
	const { data: session, isPending } = useSession()
	const user = session?.user

	if (isPending) {
		return (
			<div className="flex flex-col items-end gap-1">
				<Skeleton className="h-3 w-10" />
				<Skeleton className="h-3 w-14" />
			</div>
		)
	}

	if (!user) return null

	return (
		<div className="flex flex-col items-start gap-0.5 tabular-nums">
			<span className="flex items-center gap-1 font-medium text-[11px] text-muted-foreground">
				<IconFlame className="size-3 text-orange-400" />
				{user.currentStreak ?? 0}d streak
			</span>
			<span className="flex items-center gap-1 font-medium text-[11px] text-muted-foreground">
				<IconTrophy className="size-3 text-emerald-500" />
				{(user.totalPoints ?? 0).toLocaleString()} pts
			</span>
		</div>
	)
}
