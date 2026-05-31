export type TypeFilter = "all" | "public" | "private"

export const TYPE_FILTER_KEYS: TypeFilter[] = ["all", "public", "private"]

export type SolveCelebrationData = {
	problemTitle: string
	pointsEarned: number
	isFirstInGroup: boolean
	currentStreak: number
	totalPoints: number
}
