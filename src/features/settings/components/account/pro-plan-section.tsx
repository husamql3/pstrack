import { sileo } from "sileo"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import type { MeResponse } from "@/server/users/users.type"
import { startProCheckout } from "../../lib/pro-checkout"
import { SectionCard } from "../section-card"

export const ProPlanSection = ({ me }: { me: MeResponse }) => {
	const isPro = me.isPro

	const handleUpgrade = async () => {
		await sileo.promise(startProCheckout(authClient), {
			loading: { title: "Redirecting to Polar..." },
			success: { title: "Opening Polar checkout..." },
			error: (err) => ({
				title: "Could not start checkout",
				description: err instanceof Error ? err.message : "Please try again.",
			}),
		})
	}

	return (
		<SectionCard
			title="PStrack Pro"
			description={
				isPro
					? "Lifetime Pro is active on your account."
					: "Upgrade once, keep Pro forever. No subscription, no renewals."
			}
			badge={isPro ? "Active" : "$14 lifetime"}
		>
			<div className="space-y-4">
				<div className="grid gap-2 text-sm sm:grid-cols-2">
					<PlanFeature>Join up to 5 groups</PlanFeature>
					<PlanFeature>Groups up to 50 members</PlanFeature>
					<PlanFeature>Private groups</PlanFeature>
					<PlanFeature>4 pauses per month</PlanFeature>
					<PlanFeature>Global leaderboard</PlanFeature>
					<PlanFeature>Profile Pro badge</PlanFeature>
				</div>
				{isPro ? (
					<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
						<Badge variant="secondary">Pro</Badge>
						<span>
							{me.proSource ? `Source: ${me.proSource}` : "Your account is Pro."}
						</span>
					</div>
				) : (
					<Button type="button" onClick={handleUpgrade}>
						Upgrade with Polar
					</Button>
				)}
			</div>
		</SectionCard>
	)
}

const PlanFeature = ({ children }: { children: string }) => (
	<div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-muted-foreground">
		{children}
	</div>
)
