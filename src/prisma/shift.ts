import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  await db.$connect()

  const newRoadmap = JSON.parse(fs.readFileSync(path.join(__dirname, 'roadmap.json'), 'utf-8'))
  await db.$transaction([
    db.roadmap.updateMany({
      data: {},
      where: {
        problem_order: {
          gte: 200, // todo
        },
      },
    }),
    db.roadmap.createMany({
      data: newRoadmap,
    }),
  ])
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
