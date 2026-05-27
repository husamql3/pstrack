import { Accordion } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import type { RoadmapProblemResponse } from "@/server/problems/problems.type"
import { TopicGroup } from "./topic-group"

type GroupedTopic = { topic: string; problems: RoadmapProblemResponse[] }

export const ProblemList = ({
	grouped,
	isPending,
	isFetching,
}: {
	grouped: GroupedTopic[]
	isPending: boolean
	isFetching: boolean
}) => {
	if (isPending) {
		return (
			<div className="space-y-2">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="bg-muted h-12 animate-pulse rounded-lg" />
				))}
			</div>
		)
	}

	if (grouped.length === 0) {
		return (
			<div className="text-muted-foreground rounded-lg p-8 text-center text-sm">
				No problems match your filters.
			</div>
		)
	}

	return (
		<div className={cn("transition-opacity duration-150", isFetching && "opacity-50")}>
			<Accordion
				className="overflow-hidden rounded-lg border-0 shadow-none"
				type="single"
				collapsible
				defaultValue={grouped[0]?.topic}
			>
				{grouped.map(({ topic, problems }) => (
					<TopicGroup key={topic} topic={topic} problems={problems} />
				))}
			</Accordion>
		</div>
	)
}
