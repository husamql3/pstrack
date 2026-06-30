/**
 * Master seed — runs all seed scripts in order.
 *
 * Usage: bun run db:seed
 *
 * Steps:
 *   1. Problems  — upserts all NeetCode 250 problems
 *   2. Groups    — upserts 50 dummy users + 9 groups with memberships
 *   3. Daily     — creates 35 days of DailyProblems + UserSolves,
 *                  writes PointsHistory, and syncs User.totalPoints /
 *                  currentStreak / longestStreak so the UI looks realistic
 */

import { problemsDao } from "@/server/problems/problems.dao"
import { seedDailyProblems } from "./seed-daily-problems"
import { seedGroups } from "./seed-groups"

console.log("\n📚 Seeding problems...")
const problemResult = await problemsDao.seedStarterProblems()
console.log(`  ✓ ${problemResult.seeded} problems ready`)

await seedGroups()

await seedDailyProblems()

console.log("\n✅ All seeds complete")
process.exit(0)
