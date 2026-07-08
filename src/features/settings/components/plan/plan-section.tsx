import { IconCheck } from "@tabler/icons-react"

import { SectionCard } from "@/features/settings/components/section-card"
import {
	PRO_FEATURES,
	PRO_PRICE_CAPTION,
	PRO_PRICE_LABEL,
} from "@/features/settings/constants"
import { ProSource } from "@/generated/prisma/enums"
import { cn } from "@/lib/utils"
import type { MeResponse } from "@/server/users/users.type"
import { UpgradeButton } from "./upgrade-button"

export const PlanSection = ({ me }: { me: MeResponse }) =>
	me.isPro ? <CurrentProCard proSource={me.proSource} /> : <UpgradeCard />

const CurrentProCard = ({ proSource }: { proSource: ProSource | null }) => (
	<SectionCard
		badge="Pro"
		description="You have lifetime access to every Pro feature."
		title="Pro plan"
	>
		<ul className="flex flex-col gap-2.5">
			{PRO_FEATURES.map((feature) => (
				<FeatureRow key={feature} label={feature} unlocked />
			))}
		</ul>
		<p className="mt-5 text-muted-foreground text-sm">{proSourceNote(proSource)}</p>
	</SectionCard>
)

const UpgradeCard = () => (
	<SectionCard
		description="A one-time purchase — no subscriptions, no renewals. Pro is yours for life."
		title="Upgrade to Pro"
	>
		<div className="flex items-baseline gap-2">
			<span className="font-semibold text-3xl tracking-tight">{PRO_PRICE_LABEL}</span>
			<span className="text-muted-foreground text-sm">{PRO_PRICE_CAPTION}</span>
		</div>
		<ul className="mt-5 flex flex-col gap-2.5">
			{PRO_FEATURES.map((feature) => (
				<FeatureRow key={feature} label={feature} unlocked={false} />
			))}
		</ul>
		<div className="mt-6">
			<UpgradeButton />
		</div>
	</SectionCard>
)

const FeatureRow = ({ label, unlocked }: { label: string; unlocked: boolean }) => (
	<li className="flex items-center gap-2.5 text-sm">
		<IconCheck
			aria-hidden="true"
			className={cn("size-4 shrink-0", unlocked ? "text-success" : "text-primary")}
		/>
		<span>{label}</span>
	</li>
)

const proSourceNote = (proSource: ProSource | null): string => {
	if (proSource === ProSource.POLAR_PURCHASE)
		return "Unlocked with your one-time purchase — thanks for supporting pstrack."
	if (proSource === ProSource.POINTS_THRESHOLD)
		return "Earned by reaching the points threshold. It's yours for life."
	return "Lifetime access — no renewals, ever."
}
