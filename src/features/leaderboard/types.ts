import type { LeaderboardPeriod } from "@/server/leaderboard/leaderboard.type"

export type LeaderboardMode = "group" | "global"

export type { LeaderboardPeriod }

export const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
	{ value: "week", label: "Week" },
	{ value: "month", label: "Month" },
	{ value: "alltime", label: "All-time" },
]
