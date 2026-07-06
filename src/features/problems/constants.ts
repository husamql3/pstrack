import { Difficulty } from "@/generated/prisma/enums"
import type { RoadmapKey } from "@/server/problems/problems.type"
import type { DifficultyFilter, StatusFilter } from "./types"

export const DEFAULT_ROADMAP_KEY: RoadmapKey = "NC250"

export const ROADMAP_LABELS: Record<string, string> = {
	NC250: "NeetCode 250",
	NC150: "NeetCode 150",
	BLIND75: "Blind 75",
	TOP_INTERVIEW_150: "Top Interview 150",
	TOP_SQL_50: "SQL 50",
	DYNAMIC_PROGRAMMING: "Dynamic Programming",
	JS_30: "30 Days of JavaScript",
}

export const ROADMAP_DESCRIPTIONS: Record<string, string> = {
	NC250: "Full 250-problem roadmap",
	NC150: "Core 150 problems",
	BLIND75: "Classic 75 problems",
	TOP_INTERVIEW_150: "Original and classic interview questions",
	TOP_SQL_50: "Essential SQL interview questions",
	DYNAMIC_PROGRAMMING: "Essential dynamic programming patterns",
	JS_30: "JavaScript basics and fluency problems",
}

export const ROADMAP_KEYS: RoadmapKey[] = [
	"NC250",
	"NC150",
	"BLIND75",
	"TOP_INTERVIEW_150",
	"TOP_SQL_50",
	"DYNAMIC_PROGRAMMING",
	"JS_30",
]

export const ROADMAP_SHORT: Record<string, string> = {
	NC250: "NC250",
	NC150: "NC150",
	BLIND75: "Blind75",
	TOP_INTERVIEW_150: "TI150",
	TOP_SQL_50: "SQL50",
	DYNAMIC_PROGRAMMING: "DP",
	JS_30: "JS30",
}

export const ROADMAP_TONE: Record<string, string> = {
	NC250:
		"border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-500/35 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-500/20",
	NC150:
		"border-violet-500/30 bg-violet-500/10 text-violet-700 dark:border-violet-500/35 dark:bg-violet-950/50 dark:text-violet-400 dark:ring-violet-500/20",
	BLIND75:
		"border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-500/35 dark:bg-amber-950/50 dark:text-amber-400 dark:ring-amber-500/20",
	TOP_INTERVIEW_150:
		"border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:border-cyan-500/35 dark:bg-cyan-950/50 dark:text-cyan-400 dark:ring-cyan-500/20",
	TOP_SQL_50:
		"border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-500/20",
	DYNAMIC_PROGRAMMING:
		"border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-500/35 dark:bg-rose-950/50 dark:text-rose-400 dark:ring-rose-500/20",
	JS_30:
		"border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:border-yellow-500/35 dark:bg-yellow-950/50 dark:text-yellow-400 dark:ring-yellow-500/20",
}

export const ROADMAP_TOTALS: Record<string, number> = {
	NC250: 250,
	NC150: 150,
	BLIND75: 75,
	TOP_INTERVIEW_150: 150,
	TOP_SQL_50: 50,
	DYNAMIC_PROGRAMMING: 46,
	JS_30: 30,
}

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

export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
	[Difficulty.EASY]: 5,
	[Difficulty.MEDIUM]: 10,
	[Difficulty.HARD]: 15,
}

export const TOPIC_TONE_FALLBACK =
	"border-slate-500/30 bg-slate-500/10 text-slate-700 dark:border-slate-500/35 dark:bg-slate-950/50 dark:text-slate-400 dark:ring-slate-500/20"

export const TOPIC_TONE: Record<string, string> = {
	// Easy tier (cool hues)
	"Arrays & Hashing":
		"border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-500/20",
	"Two Pointers":
		"border-teal-500/30 bg-teal-500/10 text-teal-700 dark:border-teal-500/35 dark:bg-teal-950/50 dark:text-teal-400 dark:ring-teal-500/20",
	Stack:
		"border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:border-cyan-500/35 dark:bg-cyan-950/50 dark:text-cyan-400 dark:ring-cyan-500/20",
	"Bit Manipulation":
		"border-sky-500/30 bg-sky-500/10 text-sky-700 dark:border-sky-500/35 dark:bg-sky-950/50 dark:text-sky-400 dark:ring-sky-500/20",
	"Math & Geometry":
		"border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-500/35 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-500/20",
	"Linked List":
		"border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:border-indigo-500/35 dark:bg-indigo-950/50 dark:text-indigo-400 dark:ring-indigo-500/20",
	// Medium tier (mid hues)
	Trees:
		"border-green-500/30 bg-green-500/10 text-green-700 dark:border-green-500/35 dark:bg-green-950/50 dark:text-green-400 dark:ring-green-500/20",
	"Sliding Window":
		"border-lime-500/30 bg-lime-500/10 text-lime-700 dark:border-lime-500/35 dark:bg-lime-950/50 dark:text-lime-400 dark:ring-lime-500/20",
	"Binary Search":
		"border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:border-yellow-500/35 dark:bg-yellow-950/50 dark:text-yellow-400 dark:ring-yellow-500/20",
	"Heap / Priority Queue":
		"border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-500/35 dark:bg-amber-950/50 dark:text-amber-400 dark:ring-amber-500/20",
	Backtracking:
		"border-violet-500/30 bg-violet-500/10 text-violet-700 dark:border-violet-500/35 dark:bg-violet-950/50 dark:text-violet-400 dark:ring-violet-500/20",
	Graphs:
		"border-purple-500/30 bg-purple-500/10 text-purple-700 dark:border-purple-500/35 dark:bg-purple-950/50 dark:text-purple-400 dark:ring-purple-500/20",
	Greedy:
		"border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700 dark:border-fuchsia-500/35 dark:bg-fuchsia-950/50 dark:text-fuchsia-400 dark:ring-fuchsia-500/20",
	Intervals:
		"border-pink-500/30 bg-pink-500/10 text-pink-700 dark:border-pink-500/35 dark:bg-pink-950/50 dark:text-pink-400 dark:ring-pink-500/20",
	// Hard tier (warm hues)
	"1-D Dynamic Programming":
		"border-orange-500/30 bg-orange-500/10 text-orange-700 dark:border-orange-500/35 dark:bg-orange-950/50 dark:text-orange-400 dark:ring-orange-500/20",
	"2-D Dynamic Programming":
		"border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-400 dark:ring-red-500/15",
	Tries:
		"border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-500/35 dark:bg-rose-950/50 dark:text-rose-400 dark:ring-rose-500/20",
	"Advanced Graphs":
		"border-stone-500/30 bg-stone-500/10 text-stone-700 dark:border-stone-500/35 dark:bg-stone-950/50 dark:text-stone-400 dark:ring-stone-500/20",
}
