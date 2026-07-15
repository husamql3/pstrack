import {
	IconCode,
	IconFlame,
	IconHome,
	IconMedal,
	IconTrophy,
	IconUsers,
} from "@tabler/icons-react"
import { Link, useRouterState } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"

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

// The header remounts on most navigations (each top-level route renders its
// own AppHeader), so component state can't carry the underline position across
// a nav. This module-level cache survives remounts within the page session —
// the remounted underline starts at the previous tab and animates to the new
// one, instead of sliding in from x=0 (#231). Only written from a client
// effect, so it never leaks across SSR requests.
let lastActiveStyle: { left: string; width: string } | null = null

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
	const [activeStyle, setActiveStyle] = useState(() => lastActiveStyle)
	const tabRefs = useRef<(HTMLDivElement | null)[]>([])
	const underlineRef = useRef<HTMLDivElement | null>(null)

	// The route commit can unmount this header mid-slide (the old instance
	// starts animating as soon as the URL flips). While a slide is running,
	// keep writing the underline's current ANIMATED position (offsetLeft
	// returns the interpolated value during a transition) into the module
	// cache — whenever the unmount lands, the next instance resumes the slide
	// from the last painted frame instead of snapping to the target.
	useEffect(() => {
		if (!activeStyle) return
		let raf = 0
		const started = performance.now()
		const track = () => {
			const u = underlineRef.current
			if (u) {
				lastActiveStyle = { left: `${u.offsetLeft}px`, width: `${u.offsetWidth}px` }
			}
			if (performance.now() - started < 350) raf = requestAnimationFrame(track)
		}
		raf = requestAnimationFrame(track)
		return () => cancelAnimationFrame(raf)
	}, [activeStyle])

	useEffect(() => {
		if (hoveredIndex !== null) {
			const el = tabRefs.current[hoveredIndex]
			if (el) setHoverStyle({ left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` })
		}
	}, [hoveredIndex])

	// Double rAF on purpose: the previous tab's position (restored from
	// lastActiveStyle) must get one PAINTED frame before the update, or the
	// browser collapses both styles into one recalc and skips the transition.
	// On a fresh page load there's no previous position — the underline mounts
	// directly at the active tab with nothing to animate from.
	useEffect(() => {
		let frame2 = 0
		const frame1 = requestAnimationFrame(() => {
			frame2 = requestAnimationFrame(() => {
				const el = tabRefs.current[activeIndex]
				if (el) {
					const next = { left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` }
					setActiveStyle(next)
					lastActiveStyle = next
				}
			})
		})
		return () => {
			cancelAnimationFrame(frame1)
			cancelAnimationFrame(frame2)
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

					{/* Active underline — animates from the previous tab's position */}
					{activeIndex >= 0 && activeStyle && (
						<div
							ref={underlineRef}
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
