import type { Prisma } from "@/generated/prisma/client"

// ─── Period ───────────────────────────────────────────────────────────────────

export type LeaderboardPeriod = "week" | "month" | "alltime"

// ─── Entry ────────────────────────────────────────────────────────────────────

export const leaderboardUserSelect = {
	id: true,
	username: true,
	name: true,
	isPro: true,
	currentStreak: true,
	totalPoints: true,
} satisfies Prisma.UserSelect

export type LeaderboardEntry = {
	rank: number
	userId: string
	username: string | null
	name: string
	isPro: boolean
	periodPoints: number
	currentStreak: number
}

// ─── Group leaderboard ────────────────────────────────────────────────────────

export type GroupLeaderboardResponse = {
	groupId: string
	groupSlug: string
	memberCount: number
	period: LeaderboardPeriod
	entries: LeaderboardEntry[]
}

// ─── Global leaderboard ───────────────────────────────────────────────────────

export type GlobalLeaderboardResponse = {
	period: LeaderboardPeriod
	entries: LeaderboardEntry[]
}
