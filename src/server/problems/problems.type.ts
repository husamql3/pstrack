import type { Prisma } from "@/generated/prisma/client"
import type { BadgeType, SolveStatus } from "@/generated/prisma/enums"

export type RoadmapKey = string

export const problemSelect = {
	id: true,
	slug: true,
	title: true,
	difficulty: true,
	topic: true,
	roadmapIndex: true,
	leetcodeId: true,
	isPremium: true,
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
			pausesTotal: number
			groupRank: null
			groupSize: null
			userStats: UserStats
	  }
	| {
			state: "NO_PROBLEMS"
			group: null
			dailyProblem: null
			solve: null
			pausesRemaining: number
			pausesTotal: number
			groupRank: null
			groupSize: null
			userStats: UserStats
	  }
	| {
			state: "NOT_STARTED"
			group: Prisma.GroupGetPayload<{
				select: { id: true; slug: true; roadmap: true }
			}>
			groupRoadmap: RoadmapKey
			dailyProblem: null
			solve: null
			pausesRemaining: number
			pausesTotal: number
			groupRank: number
			groupSize: number
			userStats: UserStats
	  }
	| {
			state: "READY"
			group: Prisma.GroupGetPayload<{
				select: { id: true; slug: true; roadmap: true }
			}>
			groupRoadmap: RoadmapKey
			dailyProblem: Omit<DailyProblemRow, "solves">
			solve: DailyProblemRow["solves"][number] | null
			pausesRemaining: number
			pausesTotal: number
			groupRank: number
			groupSize: number
			groupSolvedCount: number
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
				| "PREMIUM_SKIPPED"
				| "NOT_STARTED"
			today: TodayProblemResponse
	  }
	| {
			error: null
			today: TodayProblemResponse
			crossedProThreshold: boolean
			newBadges: BadgeType[]
			newStreak: number
	  }

// Pause is a per-day action: it pauses every one of the user's unsolved problems
// across all their groups at once, so it returns the full per-group list rather
// than a single group's today.
export type PauseTodayResult =
	| {
			error: "NO_GROUP" | "NO_PAUSES" | "ALREADY_STARTED" | "NOTHING_TO_PAUSE"
			todays: TodayProblemResponse[]
	  }
	| { error: null; todays: TodayProblemResponse[] }

export type DailyProblemRecipient = {
	email: string
	name: string
	groupSlug: string
	problemSlug: string
	problemTitle: string
	difficulty: string
	topic: string
}
