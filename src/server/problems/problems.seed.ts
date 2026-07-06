import type { Problem } from "@/generated/prisma/client"
import data from "../../../prisma/data/problems-neetcode.json"
import leetcodeRoadmaps from "../../../prisma/data/roadmaps-leetcode.json"

export const NEETCODE_250_PROBLEMS = data as Problem[]

type LeetCodeDifficulty = "EASY" | "MEDIUM" | "HARD"

export type LeetCodeRoadmapProblemSeed = {
	position: number
	topic: string
	slug: string
	title: string
	difficulty: LeetCodeDifficulty
	leetcodeId: number
	isPremium: boolean
}

export type LeetCodeRoadmapSeed = {
	key: string
	slug: string
	title: string
	description: string
	source: string
	sortOrder: number
	problems: LeetCodeRoadmapProblemSeed[]
}

const parseLeetCodeDifficulty = (difficulty: string): LeetCodeDifficulty => {
	if (difficulty === "EASY" || difficulty === "MEDIUM" || difficulty === "HARD") {
		return difficulty
	}
	throw new Error(`Unsupported LeetCode difficulty: ${difficulty}`)
}

export const LEETCODE_STUDY_PLAN_ROADMAPS: LeetCodeRoadmapSeed[] = leetcodeRoadmaps.map(
	(roadmap) => ({
		...roadmap,
		problems: roadmap.problems.map((problem) => ({
			...problem,
			difficulty: parseLeetCodeDifficulty(problem.difficulty),
		})),
	})
)
