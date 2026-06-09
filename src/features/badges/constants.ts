import { BadgeType } from "@/generated/prisma/enums"
import type { BadgeCategory, BadgeProgress } from "@/server/badges/badges.type"

export const BADGE_ORDER: Record<BadgeCategory, BadgeType[]> = {
	streak: [
		BadgeType.STREAK_7,
		BadgeType.STREAK_30,
		BadgeType.STREAK_100,
		BadgeType.STREAK_365,
	],
	volume: [
		BadgeType.SOLVED_1,
		BadgeType.SOLVED_10,
		BadgeType.SOLVED_50,
		BadgeType.SOLVED_100,
		BadgeType.NC250_COMPLETE,
		BadgeType.NC150_COMPLETE,
		BadgeType.BLIND75_COMPLETE,
	],
	social: [
		BadgeType.FIRST_SOLVER_1,
		BadgeType.FIRST_SOLVER_10,
		BadgeType.FIRST_SOLVER_50,
		BadgeType.CONSISTENT_30,
	],
}

export const BADGE_THRESHOLDS: Record<BadgeType, number | null> = {
	[BadgeType.STREAK_7]: 7,
	[BadgeType.STREAK_30]: 30,
	[BadgeType.STREAK_100]: 100,
	[BadgeType.STREAK_365]: 365,
	[BadgeType.SOLVED_1]: 1,
	[BadgeType.SOLVED_10]: 10,
	[BadgeType.SOLVED_50]: 50,
	[BadgeType.SOLVED_100]: 100,
	[BadgeType.NC250_COMPLETE]: 250,
	[BadgeType.NC150_COMPLETE]: 150,
	[BadgeType.BLIND75_COMPLETE]: 75,
	[BadgeType.FIRST_SOLVER_1]: 1,
	[BadgeType.FIRST_SOLVER_10]: 10,
	[BadgeType.FIRST_SOLVER_50]: 50,
	[BadgeType.CONSISTENT_30]: 30,
}

export const BADGE_PROGRESS_VALUE = (
	badge: BadgeType,
	progress: BadgeProgress
): number => {
	switch (badge) {
		case BadgeType.STREAK_7:
		case BadgeType.STREAK_30:
		case BadgeType.STREAK_100:
		case BadgeType.STREAK_365:
			return progress.currentStreak
		case BadgeType.SOLVED_1:
		case BadgeType.SOLVED_10:
		case BadgeType.SOLVED_50:
		case BadgeType.SOLVED_100:
			return progress.uniqueSolveCount
		case BadgeType.NC250_COMPLETE:
			return progress.nc250SolvedCount
		case BadgeType.NC150_COMPLETE:
			return progress.nc150SolvedCount
		case BadgeType.BLIND75_COMPLETE:
			return progress.blind75SolvedCount
		case BadgeType.FIRST_SOLVER_1:
		case BadgeType.FIRST_SOLVER_10:
		case BadgeType.FIRST_SOLVER_50:
			return progress.firstSolverCount
		case BadgeType.CONSISTENT_30:
			return progress.monthSolveCount
	}
}

export type CategoryConfig = {
	label: string
	iconColor: string
}

export const CATEGORY_CONFIG: Record<BadgeCategory, CategoryConfig> = {
	streak: {
		label: "Streaks",
		iconColor: "text-warning",
	},
	volume: {
		label: "Volume",
		iconColor: "text-success",
	},
	social: {
		label: "Social",
		iconColor: "text-info",
	},
}

export const RARE_BADGES: Set<BadgeType> = new Set([
	BadgeType.STREAK_365,
	BadgeType.NC250_COMPLETE,
	BadgeType.FIRST_SOLVER_50,
])
