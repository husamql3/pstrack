/**
 * Pre-launch cleanup: wipes all game state while keeping user accounts and problem data.
 *
 * Deletes (in FK-safe order):
 *   PointsHistory, UserSolve, DailyProblem, UserBadge,
 *   GroupMemberWarning, GroupJoinRequest, GroupMember, Group
 *
 * Resets on User:
 *   totalPoints, currentStreak, longestStreak, currentStreakStartedAt,
 *   pausesUsedThisMonth, verificationFailuresThisMonth
 *
 * Keeps: user accounts, problems, sessions, admin audit log, feature flags, system config
 *
 * Run: bun prisma/reset-game-state.ts
 */

import { db } from "@/server/lib/db"

async function main() {
	console.log("Starting pre-launch game state reset...")

	// Round 1: leaf nodes with no dependents
	const [pointsHistory, userBadges, memberWarnings] = await Promise.all([
		db.pointsHistory.deleteMany(),
		db.userBadge.deleteMany(),
		db.groupMemberWarning.deleteMany(),
	])

	// Round 2: nodes that depend on DailyProblem / GroupMember
	const [userSolves, joinRequests, groupMembers] = await Promise.all([
		db.userSolve.deleteMany(),
		db.groupJoinRequest.deleteMany(),
		db.groupMember.deleteMany(),
	])

	// Round 3: DailyProblem depends on Group — must go before Group
	const dailyProblems = await db.dailyProblem.deleteMany()

	// Round 4: Groups (all children cleared)
	const groups = await db.group.deleteMany()

	// Round 5: reset user stats
	const users = await db.user.updateMany({
		data: {
			totalPoints: 0,
			currentStreak: 0,
			longestStreak: 0,
			currentStreakStartedAt: null,
			pausesUsedThisMonth: 0,
			verificationFailuresThisMonth: 0,
		},
	})

	console.log("Done.")
	console.log(`  PointsHistory deleted:       ${pointsHistory.count}`)
	console.log(`  UserBadges deleted:          ${userBadges.count}`)
	console.log(`  GroupMemberWarnings deleted: ${memberWarnings.count}`)
	console.log(`  UserSolves deleted:          ${userSolves.count}`)
	console.log(`  GroupJoinRequests deleted:   ${joinRequests.count}`)
	console.log(`  GroupMembers deleted:        ${groupMembers.count}`)
	console.log(`  DailyProblems deleted:       ${dailyProblems.count}`)
	console.log(`  Groups deleted:              ${groups.count}`)
	console.log(`  Users reset:                 ${users.count}`)
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(() => db.$disconnect())
