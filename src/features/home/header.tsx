import { Link } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export function Header() {
	const [menuState, setMenuState] = useState(false)

	return (
		<header>
			<nav
				data-state={menuState && "active"}
				className="fixed z-20 w-full border-b bg-background/50 backdrop-blur-3xl"
			>
				<div className="mx-auto max-w-6xl px-6 transition-all duration-300">
					<div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
						<div className="flex w-full items-center justify-between gap-12 lg:w-auto">
							<Link to="/" aria-label="home" className="flex items-center space-x-2">
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

						<div className="mb-6 in-data-[state=active]:block hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border bg-background p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:in-data-[state=active]:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
							<div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
								<Button
									asChild
									className="bg-zinc-100 text-black backdrop-blur-sm hover:bg-zinc-200"
								>
									<Link to="/login">
										<span>Sign In</span>
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
