import { IconFlame } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"

import { HashAvatar } from "@/features/onboarding/components/hash-avatar"
import { cn } from "@/lib/utils"
import type { LeaderboardEntry } from "@/server/leaderboard/leaderboard.type"

export const LeaderboardRow = ({
	entry,
	isViewer,
	topScore,
}: {
	entry: LeaderboardEntry
	isViewer: boolean
	topScore: number
}) => {
	const barWidth = topScore > 0 ? Math.round((entry.periodPoints / topScore) * 100) : 0
	const displayName = entry.username ?? entry.name

	const rowClass = cn(
		"group relative flex items-center gap-3 rounded-lg px-3 py-3 transition-colors",
		isViewer ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/40"
	)

	const inner = (
		<>
			{/* Rank */}
			<span className="w-10 shrink-0 font-mono text-muted-foreground text-sm tabular-nums">
				#{String(entry.rank).padStart(2, "0")}
			</span>

			{/* Avatar */}
			<div className="shrink-0">
				<HashAvatar username={displayName} size={36} />
			</div>

			{/* Name + score bar */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5">
					<span className="truncate font-medium text-sm leading-none">{displayName}</span>
					{entry.isPro && (
						<span className="rounded bg-primary/15 px-1 py-0.5 font-mono text-[10px] text-primary leading-none">
							pro
						</span>
					)}
					{isViewer && (
						<span className="text-[10px] text-muted-foreground leading-none">(you)</span>
					)}
				</div>
				{/* Score bar */}
				<div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-border">
					<div
						className="h-full rounded-full bg-primary transition-all duration-500"
						style={{ width: `${barWidth}%` }}
					/>
				</div>
			</div>

			{/* Points */}
			<span
				className={cn(
					"w-20 shrink-0 text-right font-semibold text-sm tabular-nums",
					isViewer ? "text-foreground" : "text-primary"
				)}
			>
				{entry.periodPoints.toLocaleString()}
			</span>

			{/* Streak */}
			<div className="flex w-16 shrink-0 items-center justify-end gap-1 text-sm tabular-nums">
				{entry.currentStreak > 0 ? (
					<>
						<IconFlame className="size-4 text-orange-400" />
						<span>{entry.currentStreak}d</span>
					</>
				) : (
					<span className="text-muted-foreground">—</span>
				)}
			</div>
		</>
	)

	if (entry.username) {
		return (
			<Link to="/$username" params={{ username: entry.username }} className={rowClass}>
				{inner}
			</Link>
		)
	}

	return <div className={rowClass}>{inner}</div>
}
