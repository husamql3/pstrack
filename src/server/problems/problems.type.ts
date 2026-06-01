import type { Prisma } from "@/generated/prisma/client"
import type { BadgeType, Roadmap, SolveStatus } from "@/generated/prisma/enums"

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

type UserStats = {
	currentStreak: number
	longestStreak: number
	totalPoints: number
}

export type TodayProblemResponse =
	| {
			state: "NO_GROUP"
			group: null
			dailyProblem: null
			solve: null
			pausesRemaining: number
			userStats: UserStats
	  }
	| {
			state: "NO_PROBLEMS"
			group: null
			dailyProblem: null
			solve: null
			pausesRemaining: number
			userStats: UserStats
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
			userStats: UserStats
	  }

export type RoadmapProblemResponse = ProblemResponse & {
	status: SolveStatus | "UNSOLVED"
}

export type MarkSolvedResult =
	| {
			error:
				| "NO_GROUP"
				| "NO_PROBLEMS"
				| "PAUSED"
				| "NOT_VERIFIED"
				| "VERIFICATION_FAILED_PENALIZED"
			today: TodayProblemResponse
	  }
	| {
			error: null
			today: TodayProblemResponse
			crossedProThreshold: boolean
			newBadges: BadgeType[]
			newStreak: number
	  }

export type PauseTodayResult =
	| {
			error: "NO_GROUP" | "NO_PROBLEMS" | "NO_PAUSES" | "ALREADY_STARTED"
			today: TodayProblemResponse
	  }
	| { error: null; today: TodayProblemResponse }
