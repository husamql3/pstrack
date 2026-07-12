export const SOLVE_POINTS = {
	EASY: 5,
	MEDIUM: 10,
	HARD: 15,
} as const

export const FIRST_IN_GROUP_BONUS = 10
export const COMEBACK_BONUS = 3
export const EARLY_BIRD_BONUS = 2
export const EARLY_BIRD_WINDOW_MS = 12 * 60 * 60 * 1000
export const MISSED_PENALTY = 3
export const PAUSE_PENALTY = 5
export const JOIN_GROUP_BONUS = 20
export const PRO_THRESHOLD = 3_000
export const STREAK_MULTIPLIER_7 = 1.2
export const STREAK_MULTIPLIER_30 = 1.5

export type PointDriftRow = {
	userId: string
	currentTotal: number
	expectedTotal: number
	isPro: boolean
}

export type PointReconciliationResult = {
	checkedUsers: number
	mismatchedUsers: number
	absoluteDrift: number
	correctedUsers: number
	proGranted: number
}
