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
import { PointReason, SolveStatus } from "@/generated/prisma/enums"
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
		if (r < 0.6) return null
		return SolveStatus.SOLVED
	}
	if (r < 0.62) return SolveStatus.SOLVED
	if (r < 0.74) return SolveStatus.MISSED
	if (r < 0.88) return SolveStatus.PAUSED
	return null
}

const pointsFor = (status: SolveStatus) => {
	if (status === SolveStatus.SOLVED) return 10
	if (status === SolveStatus.MISSED) return -3
	return 0
}

export async function seedDailyProblems() {
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

	// Clear PointsHistory for seed users before wiping UserSolves (FK constraint).
	// Also reset denormalized stats — they'll be recomputed at the end.
	await db.pointsHistory.deleteMany({ where: { userId: { in: allMemberUserIds } } })
	await db.user.updateMany({
		where: { id: { in: allMemberUserIds } },
		data: {
			totalPoints: 0,
			currentStreak: 0,
			longestStreak: 0,
			currentStreakStartedAt: null,
		},
	})

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

		const problems = await db.roadmapProblem.findMany({
			where: { roadmap: { key: group.roadmap }, problem: { isPremium: false } },
			orderBy: { position: "asc" },
			take: DAYS_OF_HISTORY,
			select: { problemId: true },
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
			const problemId = problems[dayOffset % problems.length].problemId
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

	// ─── PointsHistory + User stats ───────────────────────────────────────────────

	console.log("\n📊 Computing user stats and writing points ledger...")

	const allSolves = await db.userSolve.findMany({
		where: { userId: { in: allMemberUserIds } },
		select: {
			id: true,
			userId: true,
			status: true,
			pointsEarned: true,
			isFirstInGroup: true,
			dailyProblem: { select: { assignedDate: true, groupId: true } },
			verifiedAt: true,
		},
	})

	// Build PointsHistory rows — one (or two for first-solver) per non-zero-delta solve.
	const historyRows: {
		userId: string
		userSolveId: string
		groupId: string
		delta: number
		reason: PointReason
		createdAt: Date
	}[] = []

	for (const solve of allSolves) {
		const { assignedDate, groupId } = solve.dailyProblem
		const createdAt = solve.verifiedAt ?? assignedDate

		if (solve.status === SolveStatus.SOLVED) {
			const basePoints = solve.isFirstInGroup
				? solve.pointsEarned - 5
				: solve.pointsEarned
			historyRows.push({
				userId: solve.userId,
				userSolveId: solve.id,
				groupId,
				delta: basePoints,
				reason: PointReason.DAILY_SOLVE,
				createdAt,
			})
			if (solve.isFirstInGroup) {
				historyRows.push({
					userId: solve.userId,
					userSolveId: solve.id,
					groupId,
					delta: 5,
					reason: PointReason.FIRST_IN_GROUP,
					createdAt,
				})
			}
		} else if (solve.status === SolveStatus.MISSED) {
			historyRows.push({
				userId: solve.userId,
				userSolveId: solve.id,
				groupId,
				delta: solve.pointsEarned,
				reason: PointReason.MISSED_DAY,
				createdAt,
			})
		}
	}

	await db.pointsHistory.createMany({ data: historyRows })
	console.log(`  ✓ ${historyRows.length} points history entries`)

	// Compute totalPoints, currentStreak, longestStreak per user.
	const solvesByUser = new Map<string, typeof allSolves>()
	for (const solve of allSolves) {
		const list = solvesByUser.get(solve.userId) ?? []
		list.push(solve)
		solvesByUser.set(solve.userId, list)
	}

	let updatedUsers = 0

	for (const [userId, solves] of solvesByUser) {
		const totalPoints = solves.reduce((sum, s) => sum + s.pointsEarned, 0)

		// Map of dayOffset → whether that day had a SOLVED solve
		const solvedOffsets = new Set<number>()
		for (const solve of solves) {
			if (solve.status === SolveStatus.SOLVED) {
				const diffMs = today.getTime() - solve.dailyProblem.assignedDate.getTime()
				solvedOffsets.add(Math.round(diffMs / DAY_MS))
			}
		}

		// Current streak: consecutive solved days ending at today (or yesterday)
		let currentStreak = 0
		const streakStart = solvedOffsets.has(0) ? 0 : 1
		for (let d = streakStart; d <= DAYS_OF_HISTORY; d++) {
			if (solvedOffsets.has(d)) currentStreak++
			else break
		}

		// Longest streak: widest consecutive run across all history
		let longestStreak = 0
		let run = 0
		for (let d = DAYS_OF_HISTORY; d >= 0; d--) {
			if (solvedOffsets.has(d)) {
				run++
				if (run > longestStreak) longestStreak = run
			} else {
				run = 0
			}
		}

		const currentStreakStartedAt =
			currentStreak > 0 ? new Date(today.getTime() - (currentStreak - 1) * DAY_MS) : null

		await db.user.update({
			where: { id: userId },
			data: { totalPoints, currentStreak, longestStreak, currentStreakStartedAt },
		})
		updatedUsers++
	}

	console.log(`  ✓ ${updatedUsers} user stat records updated`)
}

if (import.meta.main) {
	await seedDailyProblems()
	process.exit(0)
}
