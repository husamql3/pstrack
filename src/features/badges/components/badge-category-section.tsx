import { IconAward, IconBolt, IconFlame } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import type {
	BadgeCategory,
	BadgeProgress,
	EarnedBadge,
} from "@/server/badges/badges.type"
import { BADGE_ORDER, CATEGORY_CONFIG } from "../constants"
import { BadgeCard } from "./badge-card"

const CATEGORY_ICON: Record<BadgeCategory, typeof IconFlame> = {
	streak: IconFlame,
	volume: IconAward,
	social: IconBolt,
}

const SECTION_PROGRESS_BAR: Record<BadgeCategory, string> = {
	streak: "bg-amber-400",
	volume: "bg-emerald-400",
	social: "bg-purple-400",
}

export const BadgeCategorySection = ({
	category,
	earned,
	progress,
}: {
	category: BadgeCategory
	earned: EarnedBadge[]
	progress: BadgeProgress
}) => {
	const config = CATEGORY_CONFIG[category]
	const Icon = CATEGORY_ICON[category]
	const badges = BADGE_ORDER[category]
	const earnedSet = new Set(earned.map((e) => e.type))
	const earnedByType = new Map(earned.map((e) => [e.type, e]))

	const earnedCount = badges.filter((b) => earnedSet.has(b)).length
	const totalCount = badges.length
	const pct = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0

	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<Icon className={cn("size-5", config.iconColor)} />
				<h2 className="font-semibold text-base text-white">{config.label}</h2>
				<span className="ml-auto text-sm text-zinc-500 tabular-nums">
					{earnedCount}/{totalCount}
				</span>
				<div className="h-1 w-24 rounded-full bg-white/[0.06]">
					<div
						className={cn(
							"h-full rounded-full transition-all",
							SECTION_PROGRESS_BAR[category]
						)}
						style={{ width: `${pct}%` }}
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
				{badges.map((badge) => (
					<BadgeCard
						key={badge}
						badge={badge}
						earned={earnedByType.get(badge)}
						progress={progress}
					/>
				))}
			</div>
		</section>
	)
}
