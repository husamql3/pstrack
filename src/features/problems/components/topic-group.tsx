import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import { SolveStatus } from "@/generated/prisma/enums"
import type { RoadmapProblemResponse } from "@/server/problems/problems.type"
import { ProblemRow } from "./problem-row"

export const TopicGroup = ({
	topic,
	problems,
}: {
	topic: string
	problems: RoadmapProblemResponse[]
}) => {
	const assignable = problems.filter((p) => !p.isPremium)
	const solved = assignable.filter((p) => p.status === SolveStatus.SOLVED).length
	const total = assignable.length
	const ratio = total > 0 ? solved / total : 0

	return (
		<AccordionItem
			className="not-last:mb-2 border-0 not-last:border-b-0 data-open:bg-transparent"
			value={topic}
		>
			<AccordionTrigger className="hover:no-underline! items-center gap-3 border-b border-b-border px-4 py-3 sm:gap-6">
				<div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
					<span className="truncate font-semibold text-sm">{topic}</span>
					<div className="flex items-center gap-2">
						<span className="whitespace-nowrap text-muted-foreground text-xs tabular-nums">
							{solved}/{total}
						</span>
						<div className="hidden h-1.5 min-w-16 shrink-0 overflow-hidden rounded-full bg-muted sm:block sm:w-26">
							<div
								className="h-full rounded-full bg-emerald-500 transition-[width]"
								style={{ width: `${ratio * 100}%` }}
							/>
						</div>
					</div>
				</div>
			</AccordionTrigger>
			<AccordionContent className="pb-0">
				<ul className="divide-y divide-border">
					{problems.map((p) => (
						<ProblemRow key={p.roadmapIndex} problem={p} />
					))}
				</ul>
			</AccordionContent>
		</AccordionItem>
	)
}
