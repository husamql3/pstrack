import type { Difficulty } from "@/generated/prisma/enums"

export type DifficultyFilter = "all" | Difficulty
export type StatusFilter = "all" | "solved" | "unsolved"
