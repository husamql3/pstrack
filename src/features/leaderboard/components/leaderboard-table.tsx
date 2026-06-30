import { Skeleton } from "@/components/ui/skeleton"
import type { LeaderboardEntry } from "@/server/leaderboard/leaderboard.type"
import { LeaderboardRow } from "./leaderboard-row"

const ColumnHeaders = () => (
	<div className="flex items-center gap-3 px-3 pb-2">
		<span className="w-10 shrink-0 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
			RANK
		</span>
		<span className="w-9 shrink-0" />
		<span className="flex-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
			User
		</span>
		<span className="w-20 shrink-0 text-right font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
			Score
		</span>
		<span className="w-16 shrink-0 text-right font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
			Streak
		</span>
	</div>
)

export const LeaderboardTable = ({
	entries,
	viewerUserId,
	isLoading,
}: {
	entries: LeaderboardEntry[]
	viewerUserId: string | null | undefined
	isLoading: boolean
}) => {
	if (isLoading) {
		return (
			<div className="flex flex-col gap-1">
				<ColumnHeaders />
				{["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
					<Skeleton key={k} className="h-14 w-full rounded-lg" />
				))}
			</div>
		)
	}

	if (entries.length === 0) {
		return (
			<div className="rounded-lg border border-border bg-background p-8 text-center">
				<p className="text-muted-foreground text-sm">No entries yet for this period.</p>
			</div>
		)
	}

	const topScore = entries[0]?.periodPoints ?? 1

	return (
		<div className="flex flex-col gap-1">
			<ColumnHeaders />
			{entries.map((entry) => (
				<LeaderboardRow
					key={entry.userId}
					entry={entry}
					isViewer={entry.userId === viewerUserId}
					topScore={topScore}
				/>
			))}
		</div>
	)
}
