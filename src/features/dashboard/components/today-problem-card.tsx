import {
	IconCircleCheck,
	IconExternalLink,
	IconFlame,
	IconPlayerPause,
} from "@tabler/icons-react"
import { sileo } from "sileo"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	DIFFICULTY_LABELS,
	DIFFICULTY_POINTS,
	DIFFICULTY_TONE,
	TOPIC_TONE,
	TOPIC_TONE_FALLBACK,
} from "@/features/problems/constants"
import { cn } from "@/lib/utils"
import type { TodayProblemResponse } from "@/server/problems/problems.type"
import { useMarkTodaySolved, usePauseToday } from "../hooks/use-today-problem"

type ReadyToday = Extract<TodayProblemResponse, { state: "READY" }>

const computeTimeLeft = () => {
	const now = new Date()
	const midnight = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
	)
	const ms = midnight.getTime() - now.getTime()
	const h = Math.floor(ms / 3_600_000)
	const m = Math.floor((ms % 3_600_000) / 60_000)
	return `${h}h ${m}m left`
}

const formatRelativeTime = (date: Date | string) => {
	const diffMs = Date.now() - new Date(date).getTime()
	const h = Math.floor(diffMs / 3_600_000)
	const m = Math.floor((diffMs % 3_600_000) / 60_000)
	if (h > 0) return `${h}h ago`
	if (m > 0) return `${m}m ago`
	return "just now"
}

const errorDescription = (err: unknown) =>
	err instanceof Error ? err.message : "Please try again."

export const TodayProblemCard = ({ today }: { today: ReadyToday }) => {
	const solveMutation = useMarkTodaySolved()
	const pauseMutation = usePauseToday()

	const problem = today.dailyProblem.problem
	const solveStatus = today.solve?.status
	const isSolved = solveStatus === "SOLVED"
	const isLocked =
		solveMutation.isPending ||
		pauseMutation.isPending ||
		solveStatus === "SOLVED" ||
		solveStatus === "PAUSED"

	const markSolved = async () => {
		await sileo.promise(solveMutation.mutateAsync(), {
			loading: { title: "Validating on LeetCode..." },
			success: { title: "Solved! +10 pts" },
			error: (err: unknown) => ({
				title: "Could not verify",
				description: errorDescription(err),
			}),
		})
	}

	const confirmPause = async () => {
		await sileo.promise(pauseMutation.mutateAsync(), {
			loading: { title: "Pausing today..." },
			success: { title: "Today is paused" },
			error: (err: unknown) => ({
				title: "Could not pause",
				description: errorDescription(err),
			}),
		})
	}

	return (
		<div className="flex h-full flex-col rounded-lg border border-border bg-background p-5 md:p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="relative flex size-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
						<span className="relative inline-flex size-2 rounded-full bg-primary" />
					</span>
					<span className="font-medium text-sm">Today's problem</span>
					<span className="text-muted-foreground text-sm">· {computeTimeLeft()}</span>
				</div>
				<span className="text-muted-foreground text-sm">#{problem.roadmapIndex}</span>
			</div>

			{/* Badges + pts */}
			<div className="mt-4 flex items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="outline" className={cn(DIFFICULTY_TONE[problem.difficulty])}>
						{DIFFICULTY_LABELS[problem.difficulty]}
					</Badge>
					<Badge
						variant="outline"
						className={cn(TOPIC_TONE[problem.topic] ?? TOPIC_TONE_FALLBACK)}
					>
						{problem.topic}
					</Badge>
				</div>
				<div className="flex shrink-0 items-center gap-1.5 text-sm">
					<span className="font-medium">
						+{DIFFICULTY_POINTS[problem.difficulty]} pts
					</span>
				</div>
			</div>

			{/* Title */}
			<h2 className="mt-4 font-semibold text-2xl tracking-tight">{problem.title}</h2>

			{/* Actions */}
			<div className="mt-5 flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<Button disabled={isLocked} onClick={markSolved}>
						<IconCircleCheck />
						Mark as Solved
					</Button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button disabled={isLocked || today.pausesRemaining <= 0} variant="outline">
								<IconPlayerPause />
								Pause today ({today.pausesRemaining} left)
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Pause today?</AlertDialogTitle>
								<AlertDialogDescription>
									Pausing costs <strong>-5 points</strong> but preserves your streak. You
									have {today.pausesRemaining}{" "}
									{today.pausesRemaining === 1 ? "pause" : "pauses"} remaining this month.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={confirmPause}>
									Pause and lose 5 points
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
					<Button asChild variant="outline">
						<a
							href={`https://leetcode.com/problems/${problem.slug}/`}
							rel="noreferrer"
							target="_blank"
						>
							Open on LeetCode
							<IconExternalLink />
						</a>
					</Button>
				</div>

				<span className="text-muted-foreground text-sm">
					{today.groupSolvedCount} of {today.groupSize} in group solved
					{today.dailyProblem.firstSolveTime != null && (
						<> · first {formatRelativeTime(today.dailyProblem.firstSolveTime)}</>
					)}
				</span>
			</div>

			{/* Stats bar */}
			<div className="mt-5 flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
				{isSolved && today.solve ? (
					<>
						<div className="flex items-center gap-2">
							<span className="font-medium text-success">
								+{today.solve.pointsEarned} pts earned
							</span>
							{today.solve.isFirstInGroup && (
								<Badge
									variant="outline"
									className="border-primary/40 py-0 text-primary text-xs"
								>
									First in group
								</Badge>
							)}
						</div>
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<IconFlame className="size-3.5 text-orange-500" />
							<span>{today.userStats.currentStreak}-day streak</span>
						</div>
					</>
				) : (
					<>
						<div className="flex items-center gap-1.5">
							<IconFlame className="size-3.5 text-orange-500" />
							<span>
								{today.userStats.currentStreak > 0
									? `${today.userStats.currentStreak}-day streak`
									: "Start your streak today"}
							</span>
						</div>
						<span className="text-muted-foreground">#{today.groupRank} in group</span>
					</>
				)}
			</div>
		</div>
	)
}
