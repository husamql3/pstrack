import { SolveStatus } from "@/generated/prisma/enums"

import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import type { RoadmapProblemResponse } from "@/server/problems/problems.type"
import { ProblemRow } from "./problem-row"

export const TopicGroup = ({
	topic,
	problems,
}: {
	topic: string
	problems: RoadmapProblemResponse[]
}) => {
	const solved = problems.filter((p) => p.status === SolveStatus.SOLVED).length
	const total = problems.length
	const ratio = total > 0 ? solved / total : 0

	return (
		<AccordionItem
			className="data-open:bg-transparent not-last:mb-2 not-last:border-b-0 border-0"
			value={topic}
		>
			<AccordionTrigger className="hover:no-underline! items-center border-b border-b-border gap-3 px-4 py-3 sm:gap-6">
				<div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
					<span className="truncate text-sm font-semibold">{topic}</span>
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground whitespace-nowrap text-xs tabular-nums">
							{solved}/{total}
						</span>
						<div className="bg-muted hidden h-1.5 min-w-16 shrink-0 overflow-hidden rounded-full sm:block sm:w-26">
							<div
								className="h-full rounded-full bg-emerald-500 transition-[width]"
								style={{ width: `${ratio * 100}%` }}
							/>
						</div>
					</div>
				</div>
			</AccordionTrigger>
			<AccordionContent className="pb-0">
				<ul className="divide-border divide-y">
					{problems.map((p) => (
						<ProblemRow key={p.roadmapIndex} problem={p} />
					))}
				</ul>
			</AccordionContent>
		</AccordionItem>
	)
}
