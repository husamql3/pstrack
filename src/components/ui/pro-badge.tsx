import { IconStarFilled } from "@tabler/icons-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

/**
 * Animated "PRO" badge — a luxe-style shine, hand-authored on `motion` + the
 * `warning` design token (never a hardcoded gold, so theming + dark mode hold).
 *
 * The looping shine is a *sanctioned* exception to DESIGN.md §7 ("no infinite
 * ambient loops outside the landing page") — CEO-directed for Pro identity (#241).
 */
export const ProBadge = ({ className }: { className?: string }) => (
	<span
		data-slot="pro-badge"
		className={cn(
			"relative inline-flex h-5 w-fit shrink-0 items-center gap-0.5 overflow-hidden rounded-4xl border border-warning/40 bg-warning/15 px-1.5 font-semibold text-[10px] text-warning-foreground uppercase leading-none tracking-wide",
			className
		)}
	>
		<motion.span
			aria-hidden
			className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-warning/60 to-transparent"
			initial={{ x: "-150%" }}
			animate={{ x: "450%" }}
			transition={{
				duration: 1.6,
				ease: "easeInOut",
				repeat: Number.POSITIVE_INFINITY,
				repeatDelay: 1.4,
			}}
		/>
		<IconStarFilled className="relative size-2.5" />
		<span className="relative">Pro</span>
	</span>
)
