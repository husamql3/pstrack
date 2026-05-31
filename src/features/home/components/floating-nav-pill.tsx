import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { NavItems } from "@/features/home/components/nav-items"
import { cn } from "@/lib/utils"

export const FloatingNavPill = ({ isScrolled }: { isScrolled: boolean }) => {
	return (
		<motion.div
			animate={{
				gap: isScrolled ? "1rem" : "0rem",
				background: isScrolled ? "var(--color-card)" : "transparent",
			}}
			transition={{ duration: 0.5, type: "spring", bounce: 0.1 }}
			className={cn(
				"absolute inset-0 z-50 m-auto flex size-fit h-11 items-center rounded-lg transition-colors duration-500",
				isScrolled && "shadow-foreground/6.5 shadow-lg ring-1 ring-border backdrop-blur"
			)}
		>
			<Link to="/" aria-label="home" className="px-3.5">
				<Logo />
			</Link>
			<AnimatePresence initial={false}>
				{isScrolled && (
					<motion.div
						initial={{ opacity: 0, x: -156, scale: 0.8, filter: "blur(4px)", width: 0 }}
						animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)", width: "auto" }}
						exit={{ opacity: 0, x: -156, scale: 0.8, filter: "blur(4px)", width: 0 }}
						transition={{ duration: 0.5, type: "spring", bounce: 0.1 }}
						className="flex origin-left items-center overflow-hidden rounded-full"
					>
						<NavItems />
						<Button asChild size="sm" className="mx-2 gap-1 pr-1">
							<Link to="/login">
								<span>Get started</span>
								<ChevronRight className="opacity-50" />
							</Link>
						</Button>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	)
}
