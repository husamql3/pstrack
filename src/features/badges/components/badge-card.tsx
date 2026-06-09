import { IconAward, IconBolt, IconFlame } from "@tabler/icons-react"
import { format } from "date-fns"

import type { BadgeType } from "@/generated/prisma/enums"
import { cn } from "@/lib/utils"
import type {
	BadgeCategory,
	BadgeProgress,
	EarnedBadge,
} from "@/server/badges/badges.type"
import { BADGE_CATEGORY, BADGE_LABELS } from "@/server/badges/badges.type"
import {
	BADGE_PROGRESS_VALUE,
	BADGE_THRESHOLDS,
	CATEGORY_CONFIG,
	RARE_BADGES,
} from "../constants"

const CATEGORY_ICON: Record<BadgeCategory, typeof IconFlame> = {
	streak: IconFlame,
	volume: IconAward,
	social: IconBolt,
}

const PROGRESS_BAR_FILL: Record<BadgeCategory, string> = {
	streak: "bg-warning",
	volume: "bg-success",
	social: "bg-info",
}

const CARD_GRADIENT =
	"dark:bg-[radial-gradient(50%_80%_at_25%_0%,--theme(--color-foreground/.1),transparent)]"

export const BadgeCard = ({
	badge,
	earned,
	progress,
}: {
	badge: BadgeType
	earned: EarnedBadge | undefined
	progress: BadgeProgress
}) => {
	const category = BADGE_CATEGORY[badge]
	const config = CATEGORY_CONFIG[category]
	const Icon = CATEGORY_ICON[category]
	const label = BADGE_LABELS[badge]
	const threshold = BADGE_THRESHOLDS[badge]
	const currentValue = BADGE_PROGRESS_VALUE(badge, progress)
	const isRare = RARE_BADGES.has(badge)
	const isEarned = !!earned

	const progressPct =
		threshold !== null && threshold > 0
			? Math.min(100, Math.round((currentValue / threshold) * 100))
			: 0

	return (
		<div
			className={cn(
				"relative flex flex-col items-center gap-3 rounded-xl border border-border p-4",
				CARD_GRADIENT
			)}
		>
			{isRare && (
				<span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 font-mono text-[9px] text-muted-foreground uppercase tracking-[0.18em]">
					<span aria-hidden="true">◆</span>
					Rare
				</span>
			)}

			<div className={cn("flex size-12 items-center justify-center rounded-xl")}>
				<Icon
					className={cn("size-7", isEarned ? config.iconColor : "text-muted-foreground")}
				/>
			</div>

			<div className="flex w-full flex-col items-center gap-1 text-center">
				<span
					className={cn(
						"font-medium text-sm leading-tight",
						isEarned ? "text-foreground" : "text-muted-foreground"
					)}
				>
					{label}
				</span>

				{isEarned ? (
					<span className="font-mono text-[11px] text-muted-foreground tabular-nums">
						{format(new Date(earned.earnedAt), "MMM d")}
					</span>
				) : threshold !== null && threshold > 0 ? (
					<>
						<div className="mt-1 h-1 w-full rounded-full bg-muted">
							<div
								className={cn("h-full rounded-full", PROGRESS_BAR_FILL[category])}
								style={{ width: `${progressPct}%` }}
							/>
						</div>
						<span className="font-mono text-[11px] text-muted-foreground tabular-nums">
							{currentValue}/{threshold}
						</span>
					</>
				) : null}
			</div>
		</div>
	)
}
