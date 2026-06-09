import { Skeleton } from "@/components/ui/skeleton"
import type { BadgeCategory } from "@/server/badges/badges.type"
import { BADGE_ORDER } from "../constants"
import { useUserBadges } from "../hooks/use-user-badges"
import { BadgeCategorySection } from "./badge-category-section"

const EMPTY_PROGRESS = {
	currentStreak: 0,
	uniqueSolveCount: 0,
	nc250SolvedCount: 0,
	nc150SolvedCount: 0,
	blind75SolvedCount: 0,
	firstSolverCount: 0,
	monthSolveCount: 0,
}

const ALL_CATEGORIES: BadgeCategory[] = ["streak", "volume", "social"]
const TOTAL_BADGES = ALL_CATEGORIES.reduce((sum, cat) => sum + BADGE_ORDER[cat].length, 0)

export const BadgesPage = ({ userId }: { userId: string | null }) => {
	const { data, isLoading } = useUserBadges()

	if (!userId) {
		return (
			<div className="flex flex-col gap-8">
				<BadgesHeader earnedCount={0} totalCount={TOTAL_BADGES} showSummary={false} />
				{ALL_CATEGORIES.map((category) => (
					<BadgeCategorySection
						key={category}
						category={category}
						earned={[]}
						progress={EMPTY_PROGRESS}
					/>
				))}
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<Skeleton className="h-8 w-40" />
					<Skeleton className="h-4 w-56" />
				</div>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{Array.from({ length: 12 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
						<Skeleton key={i} className="h-32 rounded-2xl" />
					))}
				</div>
			</div>
		)
	}

	const earned = data?.earned ?? []
	const progress = data?.progress ?? EMPTY_PROGRESS
	const earnedCount = earned.length
	const pct = TOTAL_BADGES > 0 ? Math.round((earnedCount / TOTAL_BADGES) * 100) : 0

	return (
		<div className="flex flex-col gap-8">
			<BadgesHeader
				earnedCount={earnedCount}
				totalCount={TOTAL_BADGES}
				pct={pct}
				showSummary
			/>
			{ALL_CATEGORIES.map((category) => (
				<BadgeCategorySection
					key={category}
					category={category}
					earned={earned}
					progress={progress}
				/>
			))}
		</div>
	)
}

const BadgesHeader = ({
	earnedCount,
	totalCount,
	pct,
	showSummary,
}: {
	earnedCount: number
	totalCount: number
	pct?: number
	showSummary: boolean
}) => (
	<div className="flex flex-col gap-1">
		<h1 className="font-semibold text-3xl tracking-tight">Badges</h1>
		{showSummary && (
			<p className="text-muted-foreground text-sm">
				{earnedCount} earned of {totalCount} · {pct ?? 0}% complete
			</p>
		)}
	</div>
)
