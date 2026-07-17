import { IconInfoCircle, IconMedal, IconPlayerPause } from "@tabler/icons-react"
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
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUserBadges } from "@/features/badges/hooks/use-user-badges"
import { cn } from "@/lib/utils"
import { BADGE_CATEGORY, BADGE_LABELS } from "@/server/badges/badges.type"
import type { TodayProblemResponse } from "@/server/problems/problems.type"
import { useGroupTodayActivity } from "../hooks/use-group-activity"
import { usePauseToday, useTodayProblems } from "../hooks/use-today-problem"
import { GroupActivityCard } from "./group-activity-card"
import { TodayProblemCard } from "./today-problem-card"

type ReadyToday = Extract<TodayProblemResponse, { state: "READY" }>

const CATEGORY_DOT: Record<string, string> = {
	streak: "bg-amber-400",
	volume: "bg-emerald-400",
	social: "bg-purple-400",
}

const errorDescription = (err: unknown) =>
	err instanceof Error ? err.message : "Please try again."

export const DashboardPage = () => {
	const todayQuery = useTodayProblems()
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

	const todays = todayQuery.data

	if (todays.length === 0) {
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

	// Pauses and streak/points are user-level — identical across every entry.
	const { pausesRemaining, pausesTotal, userStats } = todays[0]

	return (
		<div className="flex flex-col gap-6">
			<DashboardHeader />

			<TooltipProvider delayDuration={200}>
				<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<StatCard
						label="Current Streak"
						value={`${userStats.currentStreak}d`}
						subtitle={
							userStats.currentStreak > 0 &&
							userStats.currentStreak === userStats.longestStreak
								? "Personal best"
								: `Best: ${userStats.longestStreak}d`
						}
						highlight={
							userStats.currentStreak > 0 &&
							userStats.currentStreak === userStats.longestStreak
						}
						tooltip="Consecutive days you solved at least one problem. A full no-show resets it; a pause keeps it alive."
					/>
					<StatCard
						label="Total Points"
						value={userStats.totalPoints.toLocaleString()}
						subtitle="Across all your groups"
						tooltip="Points from solves, bonuses, and penalties across every group you're in."
					/>
					<StatCard
						label="Pauses Left"
						value={`${pausesRemaining}/${pausesTotal}`}
						subtitle="this month"
						tooltip="Skip a whole day — across all your groups — without losing your streak. Resets monthly."
					/>
				</section>
			</TooltipProvider>

			<section className="flex flex-col gap-3">
				{todays.map((today, index) => (
					<GroupTodaySection key={today.group?.id ?? `entry-${index}`} today={today} />
				))}
			</section>

			<BadgesShelf
				isLoading={badgesQuery.isLoading}
				earned={badgesQuery.data?.earned ?? []}
			/>
		</div>
	)
}

// One dashboard row per group. READY groups get the problem card + activity feed;
// not-yet-started / unseeded groups get a compact notice.
const GroupTodaySection = ({ today }: { today: TodayProblemResponse }) => {
	if (today.state === "NOT_STARTED") {
		return (
			<section className="rounded-lg border border-border bg-background p-6">
				<p className="font-medium text-sm">{today.group.slug} hasn't started yet.</p>
				<p className="mt-1 max-w-xl text-muted-foreground text-sm">
					Daily problems begin after an admin starts the group and the next midnight UTC
					assignment runs.
				</p>
			</section>
		)
	}

	if (today.state === "NO_PROBLEMS" || today.state === "NO_GROUP") {
		return (
			<section className="rounded-lg border border-border bg-background p-6">
				<p className="font-medium text-sm">No problems available for this group.</p>
				<p className="mt-1 text-muted-foreground text-sm">
					An admin needs to seed the roadmap before daily assignments can begin.
				</p>
			</section>
		)
	}

	return <ReadyGroupRow today={today} />
}

const ReadyGroupRow = ({ today }: { today: ReadyToday }) => {
	const activityQuery = useGroupTodayActivity(today.group.id)

	return (
		<div className="grid gap-3 lg:grid-cols-3">
			<div className="lg:col-span-2">
				<TodayProblemCard today={today} />
			</div>
			<div className="lg:col-span-1">
				<GroupActivityCard
					groupId={today.group.id}
					groupSlug={today.group.slug}
					events={activityQuery.data?.events ?? []}
					isLoading={activityQuery.isLoading}
				/>
			</div>
		</div>
	)
}

const DashboardHeader = () => {
	const todayQuery = useTodayProblems()
	const pauseMutation = usePauseToday()

	const todays = todayQuery.data ?? []
	const pausesRemaining = todays[0]?.pausesRemaining ?? 0
	const solvedAny = todays.some(
		(t) => t.state === "READY" && t.solve?.status === "SOLVED"
	)
	const pausableExists = todays.some((t) => t.state === "READY" && t.solve == null)
	const canPause =
		todays.length > 0 &&
		pausesRemaining > 0 &&
		!solvedAny &&
		pausableExists &&
		!pauseMutation.isPending

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
		<div className="flex items-center justify-between gap-4">
			<h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
			{todays.length > 0 && (
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button disabled={!canPause} variant="outline" size="sm">
							<IconPlayerPause />
							Pause today ({pausesRemaining} left)
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Pause today?</AlertDialogTitle>
							<AlertDialogDescription>
								Pausing costs <strong>-5 points</strong> but preserves your streak and
								skips <strong>every</strong> group's problem for today. You have{" "}
								{pausesRemaining} {pausesRemaining === 1 ? "pause" : "pauses"} remaining
								this month.
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
			)}
		</div>
	)
}

const StatCard = ({
	label,
	value,
	subtitle,
	highlight = false,
	tooltip,
}: {
	label: string
	value: string
	subtitle: string
	highlight?: boolean
	tooltip?: string
}) => (
	<div className="rounded-lg border border-border bg-background p-5">
		<p className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">
			{label}
			{tooltip && (
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							aria-label={`About ${label}`}
							className="text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground"
						>
							<IconInfoCircle className="size-3.5" />
						</button>
					</TooltipTrigger>
					<TooltipContent side="top">{tooltip}</TooltipContent>
				</Tooltip>
			)}
		</p>
		<p
			className={cn(
				"mt-3 font-bold text-3xl tracking-tight",
				highlight && "text-primary"
			)}
		>
			{value}
		</p>
		<p className="mt-1 text-muted-foreground text-sm">{subtitle}</p>
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
