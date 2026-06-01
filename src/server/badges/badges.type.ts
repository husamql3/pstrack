import type { Prisma } from "@/generated/prisma/client"
import { BadgeType } from "@/generated/prisma/enums"

export type BadgeCategory = "streak" | "volume" | "social"

export const BADGE_LABELS: Record<BadgeType, string> = {
	[BadgeType.STREAK_7]: "7-Day Streak",
	[BadgeType.STREAK_30]: "30-Day Streak",
	[BadgeType.STREAK_100]: "100-Day Streak",
	[BadgeType.STREAK_365]: "365-Day Streak",
	[BadgeType.SOLVED_1]: "First Solve",
	[BadgeType.SOLVED_10]: "10 Problems",
	[BadgeType.SOLVED_50]: "50 Problems",
	[BadgeType.SOLVED_100]: "100 Problems",
	[BadgeType.NC250_COMPLETE]: "250 — Roadmap Done",
	[BadgeType.NC150_COMPLETE]: "150 — Roadmap Done",
	[BadgeType.BLIND75_COMPLETE]: "75 — Roadmap Done",
	[BadgeType.FIRST_SOLVER_1]: "First Solver ×1",
	[BadgeType.FIRST_SOLVER_10]: "First Solver ×10",
	[BadgeType.FIRST_SOLVER_50]: "First Solver ×50",
	[BadgeType.CONSISTENT_30]: "Consistent 30",
}

export const BADGE_DESCRIPTIONS: Record<BadgeType, string> = {
	[BadgeType.STREAK_7]: "Solved problems 7 days in a row",
	[BadgeType.STREAK_30]: "Solved problems 30 days in a row",
	[BadgeType.STREAK_100]: "Solved problems 100 days in a row",
	[BadgeType.STREAK_365]: "Solved problems every day for a year",
	[BadgeType.SOLVED_1]: "Solved your very first problem",
	[BadgeType.SOLVED_10]: "Solved 10 problems total",
	[BadgeType.SOLVED_50]: "Solved 50 problems total",
	[BadgeType.SOLVED_100]: "Solved 100 problems total",
	[BadgeType.NC250_COMPLETE]: "Completed the full NeetCode 250 roadmap",
	[BadgeType.NC150_COMPLETE]: "Completed the full NeetCode 150 roadmap",
	[BadgeType.BLIND75_COMPLETE]: "Completed the full Blind 75 roadmap",
	[BadgeType.FIRST_SOLVER_1]: "First to solve a daily problem in your group",
	[BadgeType.FIRST_SOLVER_10]: "First to solve 10 daily problems in your group",
	[BadgeType.FIRST_SOLVER_50]: "First to solve 50 daily problems in your group",
	[BadgeType.CONSISTENT_30]: "Solved at least once every week for 30 days",
}

export const BADGE_CATEGORY: Record<BadgeType, BadgeCategory> = {
	[BadgeType.STREAK_7]: "streak",
	[BadgeType.STREAK_30]: "streak",
	[BadgeType.STREAK_100]: "streak",
	[BadgeType.STREAK_365]: "streak",
	[BadgeType.SOLVED_1]: "volume",
	[BadgeType.SOLVED_10]: "volume",
	[BadgeType.SOLVED_50]: "volume",
	[BadgeType.SOLVED_100]: "volume",
	[BadgeType.NC250_COMPLETE]: "volume",
	[BadgeType.NC150_COMPLETE]: "volume",
	[BadgeType.BLIND75_COMPLETE]: "volume",
	[BadgeType.FIRST_SOLVER_1]: "social",
	[BadgeType.FIRST_SOLVER_10]: "social",
	[BadgeType.FIRST_SOLVER_50]: "social",
	[BadgeType.CONSISTENT_30]: "social",
}

export type BadgeProgress = {
	currentStreak: number
	uniqueSolveCount: number
	nc250SolvedCount: number
	nc150SolvedCount: number
	blind75SolvedCount: number
	firstSolverCount: number
	monthSolveCount: number
}

const earnedBadgeSelect = { type: true, earnedAt: true } satisfies Prisma.UserBadgeSelect
export type EarnedBadge = Prisma.UserBadgeGetPayload<{ select: typeof earnedBadgeSelect }>

export type UserBadgesResponse = {
	earned: EarnedBadge[]
	progress: BadgeProgress
}
