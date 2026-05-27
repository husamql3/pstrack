import { problemsDao } from "@/server/problems/problems.dao"

const result = await problemsDao.seedStarterProblems()
console.log(`Seeded ${result.seeded} problems.`)
process.exit(0)
