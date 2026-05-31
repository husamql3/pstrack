import { IconExternalLink, IconSparkles } from "@tabler/icons-react"
import { sileo } from "sileo"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import type { MeResponse } from "@/server/users/users.type"
import { errorDescription, formatDate } from "../../utils"
import { SectionCard } from "../section-card"

const POLAR_PRODUCT_SLUG = "pstrack"

export const BillingStatus = ({ me }: { me: MeResponse }) => {
	const handleUpgrade = async () => {
		await sileo.promise(
			(async () => {
				const { error } = await authClient.checkout({ slug: POLAR_PRODUCT_SLUG })
				if (error) throw new Error(error.message ?? "Couldn't start checkout")
			})(),
			{
				loading: { title: "Opening checkout..." },
				success: { title: "Redirecting" },
				error: (err) => ({
					title: "Couldn't open checkout",
					description: errorDescription(err),
				}),
			}
		)
	}

	const handlePortal = async () => {
		await sileo.promise(
			(async () => {
				const { error } = await authClient.customer.portal()
				if (error) throw new Error(error.message ?? "Couldn't open portal")
			})(),
			{
				loading: { title: "Opening portal..." },
				success: { title: "Redirecting" },
				error: (err) => ({
					title: "Couldn't open portal",
					description: errorDescription(err),
				}),
			}
		)
	}

	if (me.isPro) {
		return (
			<SectionCard
				title="PStrack Pro"
				description="You're on the lifetime Pro plan. Thanks for supporting the platform!"
			>
				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center gap-3">
						<Badge className="gap-1">
							<IconSparkles className="size-3" aria-hidden="true" />
							Pro
						</Badge>
						<span className="text-muted-foreground text-sm">
							Member since {formatDate(me.createdAt) ?? "—"}
						</span>
					</div>
					<div>
						<Button variant="outline" size="sm" onClick={handlePortal}>
							<IconExternalLink className="size-4" aria-hidden="true" />
							View receipts
						</Button>
					</div>
				</div>
			</SectionCard>
		)
	}

	return (
		<SectionCard
			title="Upgrade to Pro"
			description="One-time purchase. Lifetime access to private groups, the global leaderboard, an extra pause per month, and the Pro badge."
		>
			<div className="flex flex-col gap-4">
				<ul className="flex flex-col gap-1.5 text-sm">
					<li className="flex items-center gap-2">
						<span aria-hidden="true">·</span> Join up to 5 groups (vs 1)
					</li>
					<li className="flex items-center gap-2">
						<span aria-hidden="true">·</span> Create private groups
					</li>
					<li className="flex items-center gap-2">
						<span aria-hidden="true">·</span> 4 pauses per month (vs 2)
					</li>
					<li className="flex items-center gap-2">
						<span aria-hidden="true">·</span> Global leaderboard access
					</li>
				</ul>
				<div>
					<Button onClick={handleUpgrade}>
						<IconSparkles className="size-4" aria-hidden="true" />
						Upgrade to Pro
					</Button>
				</div>
			</div>
		</SectionCard>
	)
}
