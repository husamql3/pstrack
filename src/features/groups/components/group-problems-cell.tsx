import { IconCheck, IconCrownFilled, IconPlayerPause, IconX } from "@tabler/icons-react"
import { sileo } from "sileo"

import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SolveStatus } from "@/generated/prisma/enums"
import { cn } from "@/lib/utils"
import type { GroupProblemsCellSolve } from "@/server/groups/groups.type"

const statusCopy: Record<SolveStatus, string> = {
	SOLVED: "Solved",
	PAUSED: "Paused",
	MISSED: "Missed",
}

const errorDescription = (err: unknown) =>
	err instanceof Error ? err.message : "Please try again."

type Props = {
	solve: GroupProblemsCellSolve | null
	isTodayRow: boolean
	isOwnColumn: boolean
	isPreJoin: boolean
	isCurrentUser: boolean
	onSolve: () => Promise<unknown>
	isSolvePending: boolean
}

const StatusIcon = ({ status }: { status: SolveStatus }) => {
	switch (status) {
		case SolveStatus.SOLVED:
			return <IconCheck className="size-4 text-emerald-500" />
		case SolveStatus.PAUSED:
			return <IconPlayerPause className="size-4 text-muted-foreground" />
		case SolveStatus.MISSED:
			return <IconX className="size-4 text-red-400/70" />
	}
}

export const GroupProblemsCell = ({
	solve,
	isTodayRow,
	isOwnColumn,
	isPreJoin,
	isCurrentUser,
	onSolve,
	isSolvePending,
}: Props) => {
	const status = solve?.status ?? null
	const canMarkSolved = isTodayRow && isOwnColumn && !isPreJoin && status === null
	const isInteractive = canMarkSolved && !isSolvePending

	const handleClick = async () => {
		if (!isInteractive) return
		await sileo.promise(onSolve(), {
			loading: { title: "Validating on LeetCode..." },
			success: { title: "Solved!" },
			error: (err: unknown) => ({
				title: "Could not verify",
				description: errorDescription(err),
			}),
		})
	}

	const baseClasses = cn(
		"relative grid h-full w-full place-items-center",
		isCurrentUser && "bg-primary/[0.06]"
	)

	if (isPreJoin) {
		return (
			<div className={cn(baseClasses, "text-muted-foreground/40")} aria-hidden>
				—
			</div>
		)
	}

	const cellInner = (
		<div className={baseClasses}>
			{status === null ? (
				canMarkSolved ? (
					<Checkbox
						checked={false}
						disabled={isSolvePending}
						onCheckedChange={handleClick}
						aria-label="Mark today as solved"
					/>
				) : null
			) : (
				<StatusIcon status={status} />
			)}
			{solve?.isFirstInGroup && (
				<IconCrownFilled className="absolute top-0.5 right-0.5 size-2.5 text-amber-500" />
			)}
		</div>
	)

	if (!solve) return cellInner

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="size-full">{cellInner}</div>
			</TooltipTrigger>
			<TooltipContent>
				<div className="flex flex-col gap-0.5">
					<span className="font-medium">{statusCopy[solve.status]}</span>
					{solve.isFirstInGroup && <span>First in group · +5 bonus</span>}
					{solve.pointsEarned !== 0 && <span>{solve.pointsEarned} pts</span>}
					{solve.verifiedAt && (
						<span className="text-background/70">
							{new Date(solve.verifiedAt).toLocaleString()}
						</span>
					)}
				</div>
			</TooltipContent>
		</Tooltip>
	)
}
