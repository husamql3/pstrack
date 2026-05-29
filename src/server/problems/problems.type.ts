import type { Prisma } from "@/generated/prisma/client"
import { Roadmap, SolveStatus } from "@/generated/prisma/enums"

export type RoadmapKey = Roadmap

export const problemSelect = {
	id: true,
	slug: true,
	title: true,
	difficulty: true,
	topic: true,
	roadmapIndex: true,
	leetcodeId: true,
	neetcode250: true,
	neetcode150: true,
	blind75: true,
} satisfies Prisma.ProblemSelect

export type ProblemResponse = Prisma.ProblemGetPayload<{
	select: typeof problemSelect
}>

const dailyProblemSelect = {
	id: true,
	assignedDate: true,
	firstSolveTime: true,
	group: {
		select: {
			id: true,
			slug: true,
			roadmap: true,
		},
	},
	problem: {
		select: problemSelect,
	},
	solves: {
		select: {
			id: true,
			status: true,
			pointsEarned: true,
			isFirstInGroup: true,
			createdAt: true,
			verifiedAt: true,
		},
	},
} satisfies Prisma.DailyProblemSelect

type DailyProblemRow = Prisma.DailyProblemGetPayload<{
	select: typeof dailyProblemSelect
}>

export type TodayProblemResponse =
	| {
			state: "NO_GROUP"
			group: null
			dailyProblem: null
			solve: null
			pausesRemaining: number
	  }
	| {
			state: "NO_PROBLEMS"
			group: null
			dailyProblem: null
			solve: null
			pausesRemaining: number
	  }
	| {
			state: "READY"
			group: Prisma.GroupGetPayload<{
				select: { id: true; slug: true; roadmap: true }
			}>
			groupRoadmap: Roadmap
			dailyProblem: Omit<DailyProblemRow, "solves">
			solve: DailyProblemRow["solves"][number] | null
			pausesRemaining: number
	  }

export type RoadmapProblemResponse = ProblemResponse & {
	status: SolveStatus | "UNSOLVED"
}

export type MarkSolvedResult =
	| { error: "NO_GROUP" | "NO_PROBLEMS" | "PAUSED"; today: TodayProblemResponse }
	| { error: null; today: TodayProblemResponse }

export type PauseTodayResult =
	| {
			error: "NO_GROUP" | "NO_PROBLEMS" | "NO_PAUSES" | "ALREADY_STARTED"
			today: TodayProblemResponse
	  }
	| { error: null; today: TodayProblemResponse }
