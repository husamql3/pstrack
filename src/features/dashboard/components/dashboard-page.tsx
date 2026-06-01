import {
	IconCalendar,
	IconCircleCheck,
	IconClock,
	IconMedal,
	IconPlayerPause,
} from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useUserBadges } from "@/features/badges/hooks/use-user-badges"
import { cn } from "@/lib/utils"
import { BADGE_CATEGORY, BADGE_LABELS } from "@/server/badges/badges.type"
import {
	useMarkTodaySolved,
	usePauseToday,
	useTodayProblem,
} from "../hooks/use-today-problem"

const difficultyTone = {
	EASY: "text-emerald-600 bg-emerald-500/10",
	MEDIUM: "text-amber-600 bg-amber-500/10",
	HARD: "text-red-600 bg-red-500/10",
} as const

const statusCopy = {
	SOLVED: "Solved",
	PAUSED: "Paused",
	MISSED: "Missed",
} as const

const errorDescription = (err: unknown) =>
	err instanceof Error ? err.message : "Please try again."

const CATEGORY_DOT: Record<string, string> = {
	streak: "bg-amber-400",
	volume: "bg-emerald-400",
	social: "bg-purple-400",
}

export const DashboardPage = () => {
	const todayQuery = useTodayProblem()
	const solveMutation = useMarkTodaySolved()
	const pauseMutation = usePauseToday()
	const badgesQuery = useUserBadges()

	if (todayQuery.isLoading) {
		return (
			<div className="flex flex-col gap-6">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-64 w-full" />
			</div>
		)
	}

	if (todayQuery.isError || !todayQuery.data) {
		return (
			<div className="rounded-lg border border-border bg-background p-6">
				<p className="font-medium text-sm">Could not load your dashboard.</p>
				<p className="mt-1 text-muted-foreground text-sm">Refresh and try again.</p>
			</div>
		)
	}

	const today = todayQuery.data

	if (today.state === "NO_GROUP") {
		return (
			<div className="flex flex-col gap-6">
				<DashboardHeader />
				<section className="rounded-lg border border-border bg-background p-6">
					<p className="font-medium text-sm">You're not in a group yet.</p>
					<p className="mt-1 max-w-xl text-muted-foreground text-sm">
						You won't receive daily problems until you join or create a group.
					</p>
					<Button asChild className="mt-5">
						<Link to="/groups">Browse groups</Link>
					</Button>
				</section>
			</div>
		)
	}

	if (today.state === "NO_PROBLEMS") {
		return (
			<div className="flex flex-col gap-6">
				<DashboardHeader />
				<section className="rounded-lg border border-border bg-background p-6">
					<p className="font-medium text-sm">No problems have been seeded yet.</p>
					<p className="mt-1 text-muted-foreground text-sm">
						An admin needs to seed the roadmap before daily assignments can begin.
					</p>
				</section>
			</div>
		)
	}

	const problem = today.dailyProblem.problem
	const solveStatus = today.solve?.status
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
		<div className="flex flex-col gap-6">
			<DashboardHeader />
			<section className="rounded-lg border border-border bg-background p-5 md:p-6">
				<div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline">@{today.group.slug}</Badge>
							<Badge
								className={cn("border-transparent", difficultyTone[problem.difficulty])}
								variant="outline"
							>
								{problem.difficulty}
							</Badge>
							{solveStatus && (
								<Badge variant={solveStatus === "PAUSED" ? "secondary" : "outline"}>
									{statusCopy[solveStatus]}
								</Badge>
							)}
						</div>
						<h2 className="mt-4 font-semibold text-2xl tracking-tight">
							{problem.title}
						</h2>
						<p className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
							<IconCalendar className="size-4" />
							Problem #{problem.roadmapIndex} from the roadmap
						</p>
						<div className="mt-4 flex flex-wrap gap-2">
							<Badge variant="secondary">{problem.topic}</Badge>
						</div>
					</div>

					<div className="flex shrink-0 flex-col gap-2 md:w-52">
						<Button asChild variant="outline">
							<a
								href={`https://leetcode.com/problems/${problem.slug}/`}
								rel="noreferrer"
								target="_blank"
							>
								Open LeetCode
							</a>
						</Button>
						<Button disabled={isLocked} onClick={markSolved}>
							<IconCircleCheck />
							Mark as Solved
						</Button>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									disabled={isLocked || today.pausesRemaining <= 0}
									variant="outline"
								>
									<IconPlayerPause />
									Pause Today
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Pause today?</AlertDialogTitle>
									<AlertDialogDescription>
										Pausing costs <strong>-5 points</strong> but preserves your streak.
										You have {today.pausesRemaining}{" "}
										{today.pausesRemaining === 1 ? "pause" : "pauses"} remaining this
										month.
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
						<p className="text-muted-foreground text-xs">
							{today.pausesRemaining} pauses remaining this month
						</p>
					</div>
				</div>
			</section>

			<section className="grid gap-3 md:grid-cols-2">
				<MetricCard
					label="Current streak"
					value={`${today.userStats.currentStreak} ${today.userStats.currentStreak === 1 ? "day" : "days"}`}
				/>
				<MetricCard
					label="Today's status"
					value={solveStatus ? statusCopy[solveStatus] : "Open"}
				/>
			</section>

			<BadgesShelf
				isLoading={badgesQuery.isLoading}
				earned={badgesQuery.data?.earned ?? []}
			/>
		</div>
	)
}

const DashboardHeader = () => (
	<div>
		<p className="flex items-center gap-2 text-muted-foreground text-sm">
			<IconClock className="size-4" />
			Show up. Solve. Repeat.
		</p>
		<h1 className="mt-1 font-semibold text-3xl tracking-tight">Dashboard</h1>
	</div>
)

const MetricCard = ({ label, value }: { label: string; value: string }) => (
	<div className="rounded-lg border border-border bg-background p-4">
		<p className="text-muted-foreground text-xs">{label}</p>
		<p className="mt-1 font-medium text-sm">{value}</p>
	</div>
)

const BadgesShelf = ({
	isLoading,
	earned,
}: {
	isLoading: boolean
	earned: { type: string; earnedAt: Date }[]
}) => {
	if (isLoading) {
		return (
			<section className="flex flex-col gap-3">
				<div className="flex items-center gap-2">
					<IconMedal className="size-4 text-muted-foreground" />
					<span className="font-medium text-sm">Your Badges</span>
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-7 w-28 rounded-full" />
					<Skeleton className="h-7 w-24 rounded-full" />
					<Skeleton className="h-7 w-32 rounded-full" />
				</div>
			</section>
		)
	}

	if (earned.length === 0) return null

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<IconMedal className="size-4 text-muted-foreground" />
				<span className="font-medium text-sm">Your Badges</span>
			</div>
			<div className="flex flex-wrap gap-2">
				{earned.map((badge) => {
					const category = BADGE_CATEGORY[badge.type as keyof typeof BADGE_CATEGORY]
					const dotColor = category ? CATEGORY_DOT[category] : "bg-zinc-400"
					return (
						<span
							key={badge.type}
							className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs"
						>
							<span className={cn("size-1.5 rounded-full", dotColor)} />
							{BADGE_LABELS[badge.type as keyof typeof BADGE_LABELS] ?? badge.type}
						</span>
					)
				})}
			</div>
		</section>
	)
}
