import { Link } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"
import { useMotionValueEvent, useScroll } from "motion/react"
import { useState } from "react"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { NavItems } from "@/features/home/components/nav-items"
import { cn } from "@/lib/utils"

export function Header() {
	const [menuState, setMenuState] = useState(false)
	const [isScrolled, setIsScrolled] = useState(false)
	const { scrollY } = useScroll()

	useMotionValueEvent(scrollY, "change", (latest) => {
		setIsScrolled(latest > 75)
	})

	return (
		<header>
			<nav data-state={menuState && "active"} className="fixed z-20 w-full">
				<div className="mx-auto max-w-7xl px-6">
					<div className="relative flex flex-wrap items-center justify-between gap-6 py-6 lg:gap-0">
						<div
							className={cn(
								"flex justify-between gap-6 duration-200 max-lg:w-full",
								isScrolled && "lg:opacity-0 lg:blur-xs"
							)}
						>
							<div className="hidden size-fit lg:block">
								<NavItems />
							</div>
							<Link
								to="/"
								aria-label="home"
								className="flex items-center space-x-2 lg:hidden"
							>
								<Logo />
							</Link>

							<button
								type="button"
								onClick={() => setMenuState(!menuState)}
								aria-label={menuState ? "Close Menu" : "Open Menu"}
								className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
							>
								<Menu className="m-auto size-6 in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 duration-200" />
								<X className="absolute inset-0 m-auto size-6 -rotate-180 in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 scale-0 in-data-[state=active]:opacity-100 opacity-0 duration-200" />
							</button>
						</div>

						<div className="mb-6 in-data-[state=active]:block hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl bg-card p-6 shadow-2xl shadow-zinc-300/20 ring-1 ring-border md:flex-nowrap lg:m-0 lg:flex lg:in-data-[state=active]:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-transparent dark:shadow-none dark:lg:bg-transparent">
							<div className="lg:hidden">
								<NavItems />
							</div>
							<div
								className={cn(
									"flex w-full flex-col space-y-3 duration-200 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit",
									isScrolled && "lg:opacity-0 lg:blur-xs"
								)}
							>
								<Button asChild variant="ghost" size="sm">
									<Link to="/login">
										<span>Login</span>
									</Link>
								</Button>
								<Button asChild size="sm">
									<Link to="/login">
										<span>Sign Up</span>
									</Link>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</nav>
		</header>
	)
}
