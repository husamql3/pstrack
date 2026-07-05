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
	const checkboxLabel = problem.isPremium
		? `Skipped premium problem: ${problem.title}`
		: isSolved
			? `Solved: ${problem.title}`
			: `Not solved: ${problem.title}`

	return (
		<li>
			<div className="flex flex-wrap items-center gap-3 px-4 py-2.5 hover:bg-muted/40 sm:flex-nowrap sm:gap-4">
				<Checkbox
					aria-label={checkboxLabel}
					checked={isSolved}
					className={cn(
						isSolved
							? "border-emerald-600 data-checked:border-emerald-600 data-checked:bg-emerald-600 data-checked:text-white"
							: "border-muted-foreground/35 dark:bg-transparent"
					)}
					disabled
				/>
				<span className="w-19 shrink-0 text-muted-foreground text-xs tabular-nums tracking-tight sm:text-sm">
					{idLabel}
				</span>
				<span className="min-w-32 max-w-none flex-1 truncate font-medium text-sm sm:min-w-0">
					{problem.title}
				</span>
				<div className="flex shrink-0 items-center gap-2 sm:ml-auto">
					{problem.isPremium && (
						<Badge
							className="border-slate-500/30 bg-slate-500/10 text-slate-700 dark:border-slate-500/35 dark:bg-slate-950/50 dark:text-slate-400"
							variant="outline"
						>
							Skipped
						</Badge>
					)}
					<Badge className={DIFFICULTY_TONE[problem.difficulty]} variant="outline">
						{DIFFICULTY_LABELS[problem.difficulty]}
					</Badge>
					<a
						className="inline-flex items-center gap-1 font-medium text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
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
