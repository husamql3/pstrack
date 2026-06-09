import { IconInfoCircle, IconMedal } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"

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
import { useGroupTodayActivity } from "../hooks/use-group-activity"
import { useTodayProblem } from "../hooks/use-today-problem"
import { GroupActivityCard } from "./group-activity-card"
import { TodayProblemCard } from "./today-problem-card"

const CATEGORY_DOT: Record<string, string> = {
	streak: "bg-amber-400",
	volume: "bg-emerald-400",
	social: "bg-purple-400",
}

export const DashboardPage = () => {
	const todayQuery = useTodayProblem()
	const badgesQuery = useUserBadges()
	const groupId =
		todayQuery.data?.state === "READY" ? todayQuery.data.group.id : undefined
	const activityQuery = useGroupTodayActivity(groupId)

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

	return (
		<div className="flex flex-col gap-6">
			<DashboardHeader />
			<TooltipProvider delayDuration={200}>
				<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<StatCard
						label="Current Streak"
						value={`${today.userStats.currentStreak}d`}
						subtitle={
							today.userStats.currentStreak > 0 &&
							today.userStats.currentStreak === today.userStats.longestStreak
								? "Personal best"
								: `Best: ${today.userStats.longestStreak}d`
						}
						highlight={
							today.userStats.currentStreak > 0 &&
							today.userStats.currentStreak === today.userStats.longestStreak
						}
						tooltip="Consecutive days you’ve solved. Misses reset it; pauses keep it alive."
					/>
					<StatCard
						label="Total Points"
						value={today.userStats.totalPoints.toLocaleString()}
						subtitle="+10 today if solved"
						tooltip="+10 per solve, +5 if first in group, −3 on miss."
					/>
					<StatCard
						label="Pauses Left"
						value={`${today.pausesRemaining}/${today.pausesTotal}`}
						subtitle="this month"
						tooltip="Skip a day without losing your streak or points. Resets monthly."
					/>
					<StatCard
						label="Group Rank"
						value={`#${today.groupRank}`}
						subtitle={`of ${today.groupSize}`}
						tooltip="Your position in this group, sorted by total points."
					/>
				</section>
			</TooltipProvider>

			<section className="grid gap-3 lg:grid-cols-3">
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
			</section>

			<BadgesShelf
				isLoading={badgesQuery.isLoading}
				earned={badgesQuery.data?.earned ?? []}
			/>
		</div>
	)
}

const DashboardHeader = () => (
	<div className="space-y-1">
		<h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
	</div>
)

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
