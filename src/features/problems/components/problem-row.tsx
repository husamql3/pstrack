import { IconExternalLink } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { SolveStatus } from "@/generated/prisma/enums"
import { cn } from "@/lib/utils"
import type { RoadmapProblemResponse } from "@/server/problems/problems.type"
import { DIFFICULTY_LABELS, DIFFICULTY_TONE } from "../constants"

export const ProblemRow = ({ problem }: { problem: RoadmapProblemResponse }) => {
	const isSolved = problem.status === SolveStatus.SOLVED
	const idLabel = `#${String(problem.leetcodeId).padStart(4, "0")}`

	return (
		<li>
			<div className="hover:bg-muted/40 flex flex-wrap items-center gap-3 px-4 py-2.5 sm:flex-nowrap sm:gap-4">
				<Checkbox
					aria-label={
						isSolved ? `Solved: ${problem.title}` : `Not solved: ${problem.title}`
					}
					checked={isSolved}
					className={cn(
						isSolved
							? "border-emerald-600 data-checked:border-emerald-600 data-checked:bg-emerald-600 data-checked:text-white"
							: "border-muted-foreground/35 dark:bg-transparent"
					)}
					disabled
				/>
				<span className="text-muted-foreground w-19 shrink-0 tabular-nums text-xs tracking-tight sm:text-sm">
					{idLabel}
				</span>
				<span className="max-w-none min-w-32 flex-1 truncate text-sm font-medium sm:min-w-0">
					{problem.title}
				</span>
				<div className="flex shrink-0 items-center gap-2 sm:ml-auto">
					<Badge className={DIFFICULTY_TONE[problem.difficulty]} variant="outline">
						{DIFFICULTY_LABELS[problem.difficulty]}
					</Badge>
					<a
						className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
						href={`https://leetcode.com/problems/${problem.slug}/`}
						rel="noreferrer"
						target="_blank"
					>
						LC
						<IconExternalLink className="size-3.5" />
					</a>
				</div>
			</div>
		</li>
	)
}
