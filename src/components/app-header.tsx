import { Link, useRouterState } from "@tanstack/react-router"
import { LogOut, Shield } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { signOut, useSession } from "@/lib/auth-client"
import { Logo } from "./logo"

const NAV_LINKS = [
	{ to: "/dashboard", label: "Dashboard" },
	{ to: "/problems", label: "Problems" },
	// { to: "/groups", label: "Groups" },
	// { to: "/leaderboard", label: "Leaderboard" },
] as const

export function AppHeader() {
	const { data: session } = useSession()
	const routerState = useRouterState()
	const pathname = routerState.location.pathname

	const activeIndex = NAV_LINKS.findIndex(({ to }) => pathname.startsWith(to))

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

	useEffect(() => {
		const el = tabRefs.current[activeIndex]
		if (el) {
			setActiveStyle({ left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` })
		}
	}, [activeIndex])

	useEffect(() => {
		requestAnimationFrame(() => {
			const el = tabRefs.current[activeIndex >= 0 ? activeIndex : 0]
			if (el) {
				setActiveStyle({ left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` })
			}
		})
	}, [])

	return (
		<header className="border-border/50 sticky top-0 z-50 border-b bg-black/80 backdrop-blur-sm">
			<div className="mx-auto flex h-10 max-w-6xl items-center gap-8 px-4">
				<Link to="/dashboard">
					<Logo className="h-4 w-auto text-white" />
				</Link>

				<nav className="relative flex items-center">
					{/* Hover highlight */}
					<div
						className="absolute h-[25px] rounded-[6px] bg-white/10 transition-all duration-300 ease-out"
						style={{
							...hoverStyle,
							opacity: hoveredIndex !== null ? 1 : 0,
						}}
					/>

					{/* Active underline */}
					{activeIndex >= 0 && (
						<div
							className="absolute bottom-[-10px] h-px bg-white transition-all duration-300 ease-out"
							style={activeStyle}
						/>
					)}

					{/* Nav items */}
					<div className="relative flex items-center gap-1">
						{NAV_LINKS.map(({ to, label }, index) => (
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
										"flex h-[30px] items-center px-3 text-sm transition-colors duration-300",
										index === activeIndex
											? "text-white"
											: "text-white/50 hover:text-white",
									].join(" ")}
								>
									{label}
								</Link>
							</div>
						))}
					</div>
				</nav>

				<div className="ml-auto flex items-center gap-3">
					{/* {session?.user.role === "admin" && (
						<Link
							to="/admin"
							className="text-white/50 hover:text-white transition-colors"
							title="Admin"
						>
							<Shield className="size-4" />
						</Link>
					)} */}

					<button
						type="button"
						onClick={() => signOut()}
						className="text-white/50 hover:text-white transition-colors"
						title="Sign out"
					>
						<LogOut className="size-4" />
					</button>
				</div>
			</div>
		</header>
	)
}
