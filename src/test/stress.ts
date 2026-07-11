import { expect } from "vitest"

import { testDb } from "@/test/db"

type DuplicateRow = {
	key: string
	count: bigint
}

type OverCapacityGroupRow = {
	id: string
	slug: string
	maxMembers: number
	activeMembers: bigint
}

type FirstSolverMismatchRow = {
	id: string
	firstSolverId: string | null
}

export const stressRepetitions = (fallback: number) => {
	const raw = process.env.PSTRACK_STRESS_REPETITIONS
	if (!raw) return fallback

	const parsed = Number(raw)
	if (!Number.isInteger(parsed) || parsed < 1) return fallback
	return parsed
}

export const runConcurrent = async <T>(
	count: number,
	fn: (index: number) => Promise<T>
) => {
	return Promise.allSettled(Array.from({ length: count }, (_, index) => fn(index)))
}

const isTransientDbContention = (error: unknown) => {
	const message = error instanceof Error ? error.message : String(error)
	return (
		message.includes("deadlock detected") ||
		message.includes("could not serialize access") ||
		message.includes("40P01") ||
		message.includes("40001")
	)
}

export const withStressRetry = async <T>(
	fn: () => Promise<T>,
	attempts = 3
): Promise<T> => {
	let lastError: unknown
	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			return await fn()
		} catch (error) {
			lastError = error
			if (!isTransientDbContention(error) || attempt === attempts) break
			await new Promise((resolve) => setTimeout(resolve, attempt * 25))
		}
	}
	throw lastError
}

export const expectNoRejectedStressWork = <T>(results: PromiseSettledResult<T>[]) => {
	const rejected = results.filter((result) => result.status === "rejected")
	expect(rejected).toEqual([])
}

export const expectAllowedResponse = async (
	response: Response,
	allowedStatuses: number[]
) => {
	const body = await response.text()
	expect(
		allowedStatuses,
		`${response.url} returned ${response.status}: ${body}`
	).toContain(response.status)
	expect(response.status, `${response.url} returned 5xx: ${body}`).toBeLessThan(500)
}

const addDuplicateViolation = (
	violations: string[],
	label: string,
	rows: DuplicateRow[]
) => {
	for (const row of rows) {
		violations.push(`${label} duplicate ${row.key} count=${row.count.toString()}`)
	}
}

export const expectCoreStressInvariants = async () => {
	const violations: string[] = []

	const [
		duplicateMembers,
		duplicateJoinRequests,
		duplicateDailyProblems,
		duplicateSolves,
		duplicatePointReasons,
		duplicateBadges,
		duplicateFirstSolves,
		overCapacityGroups,
		firstSolverMismatches,
		users,
		ledgerRows,
	] = await Promise.all([
		testDb.$queryRaw<DuplicateRow[]>`
			SELECT "groupId" || ':' || "userId" AS key, COUNT(*) AS count
			FROM "GroupMember"
			GROUP BY "groupId", "userId"
			HAVING COUNT(*) > 1
		`,
		testDb.$queryRaw<DuplicateRow[]>`
			SELECT "groupId" || ':' || "userId" AS key, COUNT(*) AS count
			FROM "GroupJoinRequest"
			GROUP BY "groupId", "userId"
			HAVING COUNT(*) > 1
		`,
		testDb.$queryRaw<DuplicateRow[]>`
			SELECT "groupId" || ':' || "assignedDate" AS key, COUNT(*) AS count
			FROM "DailyProblem"
			GROUP BY "groupId", "assignedDate"
			HAVING COUNT(*) > 1
		`,
		testDb.$queryRaw<DuplicateRow[]>`
			SELECT "userId" || ':' || "dailyProblemId" AS key, COUNT(*) AS count
			FROM "UserSolve"
			GROUP BY "userId", "dailyProblemId"
			HAVING COUNT(*) > 1
		`,
		testDb.$queryRaw<DuplicateRow[]>`
			SELECT "userSolveId" || ':' || reason AS key, COUNT(*) AS count
			FROM "PointsHistory"
			WHERE "userSolveId" IS NOT NULL
			GROUP BY "userSolveId", reason
			HAVING COUNT(*) > 1
		`,
		testDb.$queryRaw<DuplicateRow[]>`
			SELECT "userId" || ':' || type AS key, COUNT(*) AS count
			FROM "user_badge"
			GROUP BY "userId", type
			HAVING COUNT(*) > 1
		`,
		testDb.$queryRaw<DuplicateRow[]>`
			SELECT "dailyProblemId" AS key, COUNT(*) AS count
			FROM "UserSolve"
			WHERE "isFirstInGroup" = true
			GROUP BY "dailyProblemId"
			HAVING COUNT(*) > 1
		`,
		testDb.$queryRaw<OverCapacityGroupRow[]>`
			SELECT g.id, g.slug, g."maxMembers", COUNT(m.id) AS "activeMembers"
			FROM "Group" g
			LEFT JOIN "GroupMember" m
				ON m."groupId" = g.id AND m.status = 'ACTIVE'
			GROUP BY g.id
			HAVING COUNT(m.id) > g."maxMembers"
		`,
		testDb.$queryRaw<FirstSolverMismatchRow[]>`
			SELECT dp.id, dp."firstSolverId"
			FROM "DailyProblem" dp
			WHERE dp."firstSolverId" IS NOT NULL
				AND NOT EXISTS (
					SELECT 1
					FROM "UserSolve" us
					WHERE us."dailyProblemId" = dp.id
						AND us."userId" = dp."firstSolverId"
						AND us."isFirstInGroup" = true
						AND us.status = 'SOLVED'
				)
		`,
		testDb.user.findMany({
			select: { id: true, totalPoints: true },
			orderBy: { id: "asc" },
		}),
		testDb.pointsHistory.findMany({
			select: { id: true, userId: true, delta: true, createdAt: true },
			orderBy: [{ createdAt: "asc" }, { id: "asc" }],
		}),
	])

	addDuplicateViolation(violations, "GroupMember", duplicateMembers)
	addDuplicateViolation(violations, "GroupJoinRequest", duplicateJoinRequests)
	addDuplicateViolation(violations, "DailyProblem", duplicateDailyProblems)
	addDuplicateViolation(violations, "UserSolve", duplicateSolves)
	addDuplicateViolation(violations, "PointsHistory", duplicatePointReasons)
	addDuplicateViolation(violations, "UserBadge", duplicateBadges)
	addDuplicateViolation(violations, "first solve", duplicateFirstSolves)

	for (const row of overCapacityGroups) {
		violations.push(
			`Group ${row.slug} over capacity ${row.activeMembers.toString()}/${row.maxMembers}`
		)
	}

	for (const row of firstSolverMismatches) {
		violations.push(
			`DailyProblem ${row.id} firstSolverId=${row.firstSolverId} has no matching solved first solve`
		)
	}

	const expectedTotals = new Map<string, number>()
	for (const row of ledgerRows) {
		const previous = expectedTotals.get(row.userId) ?? 0
		expectedTotals.set(row.userId, Math.max(0, previous + row.delta))
	}

	for (const user of users) {
		const expected = expectedTotals.get(user.id) ?? 0
		if (user.totalPoints !== expected) {
			violations.push(
				`User ${user.id} totalPoints=${user.totalPoints} expected=${expected}`
			)
		}
	}

	expect(violations).toEqual([])
}
