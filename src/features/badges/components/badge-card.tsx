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

const GRADIENT_COLOR: Record<BadgeCategory, string> = {
	streak: "rgba(245,158,11,0.25)",
	volume: "rgba(16,185,129,0.25)",
	social: "rgba(168,85,247,0.25)",
}

const ICON_BG_EARNED: Record<BadgeCategory, string> = {
	streak: "bg-amber-500/15",
	volume: "bg-emerald-500/15",
	social: "bg-purple-500/15",
}

const PROGRESS_BAR_COLOR: Record<BadgeCategory, string> = {
	streak: "bg-amber-400",
	volume: "bg-emerald-400",
	social: "bg-purple-400",
}

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
		<div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl bg-[#0d0e10] p-4 ring-1 ring-white/[0.08]">
			{isEarned && (
				<div
					aria-hidden="true"
					className="absolute inset-0 -top-10 -z-10"
					style={{
						background: `radial-gradient(60% 60% at 50% 0%, ${GRADIENT_COLOR[category]}, transparent)`,
					}}
				/>
			)}

			{isRare && (
				<span className="absolute top-2 right-2 rounded bg-purple-500/10 px-1.5 py-0.5 font-bold text-[9px] text-purple-400 uppercase tracking-wider ring-1 ring-purple-500/20">
					RARE
				</span>
			)}

			<div
				className={cn(
					"rounded-xl p-3",
					isEarned ? ICON_BG_EARNED[category] : "bg-white/[0.06]"
				)}
			>
				<Icon className={cn("size-6", isEarned ? config.iconColor : "text-zinc-600")} />
			</div>

			<div className="flex w-full flex-col items-center gap-1 text-center">
				<span
					className={cn(
						"font-semibold text-sm",
						isEarned ? "text-white" : "text-zinc-500"
					)}
				>
					{label}
				</span>

				{isEarned ? (
					<span className="text-[11px] text-zinc-500">
						{format(new Date(earned.earnedAt), "MMM d")}
					</span>
				) : threshold !== null && threshold > 0 ? (
					<>
						<div className="mt-1 h-1 w-full rounded-full bg-white/[0.06]">
							<div
								className={cn("h-full rounded-full", PROGRESS_BAR_COLOR[category])}
								style={{ width: `${progressPct}%` }}
							/>
						</div>
						<span className="text-[11px] text-zinc-500 tabular-nums">
							{currentValue}/{threshold}
						</span>
					</>
				) : null}
			</div>
		</div>
	)
}
