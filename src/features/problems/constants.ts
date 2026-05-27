import { Difficulty, Roadmap } from "@/generated/prisma/enums"
import type { RoadmapKey } from "@/server/problems/problems.type"
import type { DifficultyFilter, StatusFilter } from "./types"

export const ROADMAP_LABELS: Record<RoadmapKey, string> = {
	[Roadmap.NC250]: "NeetCode 250",
	[Roadmap.NC150]: "NeetCode 150",
	[Roadmap.BLIND75]: "Blind 75",
}

export const ROADMAP_DESCRIPTIONS: Record<RoadmapKey, string> = {
	[Roadmap.NC250]: "Full 249-problem roadmap",
	[Roadmap.NC150]: "Core 150 problems",
	[Roadmap.BLIND75]: "Classic 75 problems",
}

export const ROADMAP_KEYS: RoadmapKey[] = [Roadmap.NC250, Roadmap.NC150, Roadmap.BLIND75]

export const DIFFICULTY_FILTER_KEYS: DifficultyFilter[] = [
	"all",
	Difficulty.EASY,
	Difficulty.MEDIUM,
	Difficulty.HARD,
]

export const STATUS_FILTER_KEYS: StatusFilter[] = ["all", "solved", "unsolved"]

export const DIFFICULTY_TONE: Record<Difficulty, string> = {
	[Difficulty.EASY]:
		"border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-500/20",
	[Difficulty.MEDIUM]:
		"border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-500/35 dark:bg-amber-950/50 dark:text-amber-400 dark:ring-amber-500/20",
	[Difficulty.HARD]:
		"border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-400 dark:ring-red-500/15",
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
	[Difficulty.EASY]: "Easy",
	[Difficulty.MEDIUM]: "Medium",
	[Difficulty.HARD]: "Hard",
}
