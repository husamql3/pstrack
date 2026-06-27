import { format, parseISO } from "date-fns"

import {
	ContributionGraph,
	ContributionGraphBlock,
	ContributionGraphCalendar,
	ContributionGraphFooter,
	ContributionGraphTotalCount,
} from "@/components/ui/contribution-graph"
import { Skeleton } from "@/components/ui/skeleton"
import { useProfileHeatmap } from "../hooks/use-profile-heatmap"

export const SolveHeatmap = ({ username }: { username: string }) => {
	const { data, isLoading } = useProfileHeatmap(username)

	if (isLoading) return <Skeleton className="h-36 w-full rounded-lg" />
	if (!data || data.length === 0) return null

	return (
		<section className="flex flex-col gap-4 border-border border-t pt-8">
			<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.24em]">
				Solve Activity
			</span>
			<ContributionGraph
				data={data}
				blockSize={12}
				blockMargin={3}
				blockRadius={2}
				weekStart={1}
				maxLevel={1}
				className="w-full max-w-full"
			>
				<ContributionGraphCalendar title="Solve Activity">
					{({ activity, dayIndex, weekIndex }) => (
						<g>
							<title>
								{activity.level === 1
									? `Solved · ${format(parseISO(activity.date), "MMM d, yyyy")}`
									: format(parseISO(activity.date), "MMM d, yyyy")}
							</title>
							<ContributionGraphBlock
								activity={activity}
								dayIndex={dayIndex}
								weekIndex={weekIndex}
								className='data-[level="1"]:fill-primary'
							/>
						</g>
					)}
				</ContributionGraphCalendar>
				<ContributionGraphFooter>
					<ContributionGraphTotalCount>
						{({ totalCount }) => (
							<span className="font-mono text-[11px] text-muted-foreground tabular-nums">
								{totalCount} {totalCount === 1 ? "solve" : "solves"} in the last 52 weeks
							</span>
						)}
					</ContributionGraphTotalCount>
				</ContributionGraphFooter>
			</ContributionGraph>
		</section>
	)
}
