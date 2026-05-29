/**
 * Seed script: populates DailyProblems + UserSolves for the seed groups.
 *
 * Requires db:seed-problems and db:seed-groups to have run first.
 * Run via: bun run prisma/seed-daily-problems.ts
 *
 * Idempotent: wipes existing DailyProblems/UserSolves for the seeded groups
 * before re-creating them.
 */

import groupsData from "@/data/groups.json"
import type { Prisma } from "@/generated/prisma/client"
import { SolveStatus } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"

const DAYS_OF_HISTORY = 35
const DAY_MS = 86_400_000

const startOfTodayUtc = () => {
	const now = new Date()
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

const mulberry32 = (seed: number) => {
	let t = seed >>> 0
	return () => {
		t = (t + 0x6d2b79f5) >>> 0
		let r = Math.imul(t ^ (t >>> 15), 1 | t)
		r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296
	}
}

const pickStatus = (rand: () => number, isToday: boolean): SolveStatus | null => {
	const r = rand()
	if (isToday) {
		if (r < 0.55) return null
		if (r < 0.8) return SolveStatus.PENDING_VERIFICATION
		return SolveStatus.SOLVED
	}
	if (r < 0.62) return SolveStatus.SOLVED
	if (r < 0.74) return SolveStatus.MISSED
	if (r < 0.82) return SolveStatus.PAUSED
	if (r < 0.88) return SolveStatus.VERIFICATION_FAILED
	return null
}

const pointsFor = (status: SolveStatus) => {
	if (status === SolveStatus.SOLVED) return 10
	if (status === SolveStatus.MISSED) return -3
	return 0
}

const roadmapFilter = (roadmap: string): Prisma.ProblemWhereInput => {
	if (roadmap === "BLIND75") return { blind75: true }
	if (roadmap === "NC150") return { neetcode150: true }
	return { neetcode250: true }
}

async function seedDailyProblems() {
	console.log("🌱 Seeding daily problems + solves...")

	const seedSlugs = groupsData.map((g) => g.slug)
	const groups = await db.group.findMany({
		where: { slug: { in: seedSlugs } },
		select: {
			id: true,
			slug: true,
			roadmap: true,
			members: { select: { id: true, userId: true, joinedAt: true } },
		},
	})

	if (groups.length === 0) {
		console.error("No seed groups found. Run db:seed-groups first.")
		process.exit(1)
	}

	const allMemberUserIds = [
		...new Set(groups.flatMap((g) => g.members.map((m) => m.userId))),
	]
	console.log(`  ${groups.length} groups, ${allMemberUserIds.length} unique members`)

	// Mark ~1/3 of seed users as Pro to exercise the gold highlight.
	const proRand = mulberry32(7)
	for (const userId of allMemberUserIds) {
		await db.user.update({
			where: { id: userId },
			data: { isPro: proRand() < 0.33 },
		})
	}
	console.log(`  ✓ ~⅓ of seed users marked Pro`)

	// Backdate every membership to before our seed history starts, then pull ~20%
	// forward within the last 15 days so the table shows dim "pre-join" cells.
	const joinRand = mulberry32(11)
	const today = startOfTodayUtc()
	const baselineJoinedAt = new Date(today.getTime() - (DAYS_OF_HISTORY + 5) * DAY_MS)
	for (const g of groups) {
		for (const m of g.members) {
			const joinedAt =
				joinRand() < 0.2
					? new Date(today.getTime() - (1 + Math.floor(joinRand() * 14)) * DAY_MS)
					: baselineJoinedAt
			await db.groupMember.update({
				where: { id: m.id },
				data: { joinedAt },
			})
			m.joinedAt = joinedAt
		}
	}
	console.log(`  ✓ Backdated joinedAt; ~20% staggered into last 15 days`)

	let totalDailyProblems = 0
	let totalSolves = 0

	for (let gi = 0; gi < groups.length; gi++) {
		const group = groups[gi]
		const rand = mulberry32((gi + 1) * 13)

		const problems = await db.problem.findMany({
			where: roadmapFilter(group.roadmap),
			orderBy: { roadmapIndex: "asc" },
			take: DAYS_OF_HISTORY,
			select: { id: true },
		})
		if (problems.length === 0) continue

		// Wipe and recreate this group's DailyProblems + UserSolves.
		const existing = await db.dailyProblem.findMany({
			where: { groupId: group.id },
			select: { id: true },
		})
		if (existing.length > 0) {
			const existingIds = existing.map((dp) => dp.id)
			await db.userSolve.deleteMany({
				where: { dailyProblemId: { in: existingIds } },
			})
			await db.dailyProblem.deleteMany({ where: { groupId: group.id } })
		}

		for (let dayOffset = 0; dayOffset < DAYS_OF_HISTORY; dayOffset++) {
			const assignedDate = new Date(today.getTime() - dayOffset * DAY_MS)
			const problemId = problems[dayOffset % problems.length].id
			const isToday = dayOffset === 0

			const dp = await db.dailyProblem.create({
				data: { groupId: group.id, problemId, assignedDate },
				select: { id: true },
			})
			totalDailyProblems++

			type SolveDraft = {
				userId: string
				status: SolveStatus
				pointsEarned: number
				isFirstInGroup: boolean
				verifiedAt: Date | null
			}
			const drafts: SolveDraft[] = []
			const solvedUserIds: string[] = []

			for (const m of group.members) {
				if (m.joinedAt.getTime() > assignedDate.getTime()) continue
				const status = pickStatus(rand, isToday)
				if (!status) continue
				const verifiedAt =
					status === SolveStatus.SOLVED
						? new Date(assignedDate.getTime() + Math.floor(rand() * 14 * 3600 * 1000))
						: null
				drafts.push({
					userId: m.userId,
					status,
					pointsEarned: pointsFor(status),
					isFirstInGroup: false,
					verifiedAt,
				})
				if (status === SolveStatus.SOLVED) solvedUserIds.push(m.userId)
			}

			if (solvedUserIds.length > 0) {
				const firstSolverId = solvedUserIds[Math.floor(rand() * solvedUserIds.length)]
				const firstDraft = drafts.find((d) => d.userId === firstSolverId)
				if (firstDraft) {
					firstDraft.isFirstInGroup = true
					firstDraft.pointsEarned += 5
					await db.dailyProblem.update({
						where: { id: dp.id },
						data: {
							firstSolverId,
							firstSolveTime: firstDraft.verifiedAt,
						},
					})
				}
			}

			if (drafts.length > 0) {
				await db.userSolve.createMany({
					data: drafts.map((d) => ({
						dailyProblemId: dp.id,
						userId: d.userId,
						status: d.status,
						pointsEarned: d.pointsEarned,
						isFirstInGroup: d.isFirstInGroup,
						verifiedAt: d.verifiedAt,
					})),
				})
				totalSolves += drafts.length
			}
		}
		console.log(`  ✓ @${group.slug}: 35 daily problems`)
	}

	console.log(`✅ ${totalDailyProblems} daily problems, ${totalSolves} user solves`)
}

await seedDailyProblems()
process.exit(0)
