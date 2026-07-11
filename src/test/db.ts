/**
 * Real-database test helpers for integration tests.
 *
 * Only imported by *.integration.test.ts files — never by unit tests.
 * Uses TEST_DATABASE_URL (falls back to the local make-up DB) so CI can
 * point at a dedicated Postgres service container.
 */

import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/generated/prisma/client"
import type { Difficulty, GroupType } from "@/generated/prisma/enums"

const TEST_DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	"postgresql://pstrack:pstrack@127.0.0.1:5433/pstrack?schema=public"

export const testDb = new PrismaClient({
	adapter: new PrismaPg(TEST_DATABASE_URL),
})

/**
 * Truncate all app tables in FK-safe order and restart identity sequences.
 * Safe to call in beforeEach — keeps the schema intact.
 */
export const resetDb = async () => {
	// Table names match the actual Postgres table names (Prisma uses PascalCase
	// for models without @@map, lowercase for models with @@map).
	await testDb.$executeRawUnsafe(`
		TRUNCATE TABLE
			"job_run",
			"user_badge",
			"PointsHistory",
			"UserSolve",
			"DailyProblem",
			"RoadmapProblem",
			"RoadmapCatalog",
			"GroupMemberWarning",
			"GroupJoinRequest",
			"GroupMember",
			"Group",
			"Problem",
			"feedback",
			"system_event_log",
			"admin_audit_log",
			"feature_flag",
			"system_config",
			"verification",
			"session",
			"account",
			"user"
		RESTART IDENTITY CASCADE
	`)
}

// ---------------------------------------------------------------------------
// Fixture builders — thin wrappers that fill required fields with sensible defaults.
// ---------------------------------------------------------------------------

let _counter = 0
const uid = () => `test-${++_counter}-${Date.now()}`
// roadmapIndex must be @unique; use a large offset + counter so it doesn't
// collide even across multiple beforeEach resets in a single test run.
let _roadmapIdx = 900_000

export const createUser = async (
	overrides: Partial<{
		id: string
		name: string
		email: string
		username: string
		leetcodeHandle: string
		currentStreak: number
		longestStreak: number
		totalPoints: number
		currentStreakStartedAt: Date | null
	}> = {}
) => {
	const id = overrides.id ?? uid()
	return testDb.user.create({
		data: {
			id,
			name: overrides.name ?? `Test User ${id}`,
			email: overrides.email ?? `test-${id}@example.com`,
			emailVerified: true,
			username: overrides.username ?? `user_${id}`,
			leetcodeHandle: overrides.leetcodeHandle ?? null,
			currentStreak: overrides.currentStreak ?? 0,
			longestStreak: overrides.longestStreak ?? 0,
			totalPoints: overrides.totalPoints ?? 0,
			currentStreakStartedAt: overrides.currentStreakStartedAt ?? null,
		},
	})
}

export const createRoadmapCatalog = async (
	overrides: Partial<{
		key: string
		slug: string
		title: string
	}> = {}
) => {
	const key = overrides.key ?? "NC250"
	return testDb.roadmapCatalog.upsert({
		where: { key },
		create: {
			key,
			slug: overrides.slug ?? key.toLowerCase().replace(/_/g, "-"),
			title: overrides.title ?? key,
			description: `${key} roadmap`,
			source: "NEETCODE",
			sortOrder: 10,
		},
		update: {},
	})
}

export const createGroup = async (
	overrides: Partial<{
		id: string
		slug: string
		type: GroupType
		roadmap: string
		creatorId: string
		isActive: boolean
		isStarted: boolean
	}> = {}
) => {
	const id = overrides.id ?? uid()
	const roadmap = overrides.roadmap ?? "NC250"

	// Ensure roadmap catalog row exists (Group FK requires it)
	await createRoadmapCatalog({ key: roadmap })

	return testDb.group.create({
		data: {
			id,
			slug: overrides.slug ?? `group-${id}`,
			type: (overrides.type as GroupType) ?? "PUBLIC",
			roadmap,
			creatorId: overrides.creatorId ?? uid(),
			isActive: overrides.isActive ?? true,
			isStarted: overrides.isStarted ?? true,
		},
	})
}

export const addMember = async (groupId: string, userId: string) => {
	return testDb.groupMember.create({
		data: { groupId, userId },
	})
}

export const createProblem = async (
	overrides: Partial<{
		id: string
		slug: string
		title: string
		difficulty: Difficulty
		topic: string
		roadmapIndex: number
		neetcode250: boolean
	}> = {}
) => {
	const id = overrides.id ?? uid()
	return testDb.problem.create({
		data: {
			id,
			slug: overrides.slug ?? `problem-${id}`,
			title: overrides.title ?? `Problem ${id}`,
			difficulty: (overrides.difficulty as Difficulty) ?? "MEDIUM",
			topic: overrides.topic ?? "Arrays & Hashing",
			roadmapIndex: overrides.roadmapIndex ?? ++_roadmapIdx,
			neetcode250: overrides.neetcode250 ?? true,
		},
	})
}

export const createDailyProblem = async ({
	groupId,
	problemId,
	assignedDate,
}: {
	groupId: string
	problemId: string
	assignedDate: Date
}) => {
	return testDb.dailyProblem.create({
		data: { groupId, problemId, assignedDate },
	})
}
