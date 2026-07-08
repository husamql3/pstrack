import { IconCircleCheckFilled } from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import confetti from "canvas-confetti"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { ME_QUERY_KEY } from "@/features/settings/hooks/use-me"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type SuccessSearch = { checkout_id?: string }

export const Route = createFileRoute("/success")({
	validateSearch: (search: Record<string, unknown>): SuccessSearch => ({
		checkout_id: typeof search.checkout_id === "string" ? search.checkout_id : undefined,
	}),
	component: SuccessPage,
})

// Brand-tinted colors for confetti:
// chart-1 oklch(0.845 0.143 164.978) ≈ #6ee7b7 (light emerald)
// chart-2 oklch(0.696 0.17  162.48)  ≈ #34d399 (emerald-400)
// chart-3 oklch(0.596 0.145 163.225) ≈ #10b981 (emerald-500)
// chart-4 oklch(0.508 0.118 165.612) ≈ #059669 (emerald-600 / primary)
// chart-5 oklch(0.432 0.095 166.913) ≈ #047857 (emerald-700)
// gold accent for Pro
const BRAND_COLORS = [
	"#6ee7b7",
	"#34d399",
	"#10b981",
	"#059669",
	"#047857",
	"#d4a017",
	"#f0c040",
]

function fireFireworks(): () => void {
	let animationFrame: number

	const end = Date.now() + 4000

	function frame() {
		const timeLeft = end - Date.now()
		if (timeLeft <= 0) return

		const particleCount = Math.floor(50 * (timeLeft / 4000))

		void confetti({
			particleCount,
			angle: 60,
			spread: 55,
			origin: { x: 0, y: 0.65 },
			colors: BRAND_COLORS,
			startVelocity: 30,
			decay: 0.92,
			scalar: 0.9,
		})
		void confetti({
			particleCount,
			angle: 120,
			spread: 55,
			origin: { x: 1, y: 0.65 },
			colors: BRAND_COLORS,
			startVelocity: 30,
			decay: 0.92,
			scalar: 0.9,
		})

		animationFrame = requestAnimationFrame(frame)
	}

	animationFrame = requestAnimationFrame(frame)

	return () => cancelAnimationFrame(animationFrame)
}

const PRO_FEATURES = [
	{ emoji: "🌍", label: "Global leaderboard (top 100)" },
	{ emoji: "🗂️", label: "Solution archive" },
	{ emoji: "👥", label: "Up to 5 groups (50 members each)" },
	{ emoji: "🔒", label: "Create private groups" },
	{ emoji: "⏸️", label: "4 pauses per month" },
	{ emoji: "👑", label: "Pro gold identity badge" },
]

function SuccessPage() {
	const queryClient = useQueryClient()
	const { checkout_id } = Route.useSearch()

	// The webhook is the source of truth for the Pro grant; it may land a beat
	// before or after this redirect. Force a fresh session + `me` so Pro shows up
	// as soon as it's applied, without a manual reload.
	useEffect(() => {
		void authClient.getSession({ query: { disableCookieCache: true } })
		void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
	}, [queryClient])

	// Auto-fire brand-tinted confetti burst once on mount
	useEffect(() => {
		const cancel = fireFireworks()
		return cancel
	}, [])

	return (
		<div className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
			<div className="flex max-w-sm flex-col items-center gap-6 text-center">
				{/* Success icon */}
				<IconCircleCheckFilled className="size-16 text-success" aria-hidden="true" />

				{/* Heading */}
				<div className="space-y-1">
					<h1 className="font-semibold text-3xl tracking-tight">You're Pro 🎉</h1>
					<p className="text-muted-foreground text-sm">
						Lifetime access — no renewals, ever.
					</p>
				</div>

				{/* Order reference */}
				{checkout_id && (
					<p className={cn("font-mono text-muted-foreground text-xs")}>
						Order {checkout_id}
					</p>
				)}

				{/* Pro feature list */}
				<ul className="w-full space-y-2 text-left" aria-label="Pro features">
					{PRO_FEATURES.map(({ emoji, label }) => (
						<li
							key={label}
							className="flex items-center gap-3 rounded-lg bg-muted px-4 py-2.5 text-sm"
						>
							<span aria-hidden="true" className="text-base leading-none">
								{emoji}
							</span>
							<span>{label}</span>
						</li>
					))}
				</ul>

				{/* CTA */}
				<Button asChild size="lg" className="w-full">
					<Link to="/dashboard">Go to Dashboard</Link>
				</Button>
			</div>
		</div>
	)
}
