import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  await db.$connect()
  console.log('🌱 Starting database seeding...')

  try {
    console.log('🧹 Deleting existing data...')
    // Delete existing data
    await db.$transaction([
      db.submissions.deleteMany(),
      db.leetcoders.deleteMany(),
      db.group_progress.deleteMany(),
      db.roadmap.deleteMany(),
      db.groups.deleteMany(),
      db.resources.deleteMany(),
      db.resource_tabs.deleteMany(),
      db.resource_types.deleteMany(),
    ])

    console.log('🌱 Creating new data...')
    // Create new data for all tables
    await db.$transaction([
      db.groups.createMany({
        data: JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'groups.json'), 'utf-8')),
      }),
      db.leetcoders.createMany({
        data: JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'leetcoders.json'), 'utf-8')),
      }),
      db.roadmap.createMany({
        data: JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'roadmap.json'), 'utf-8')),
      }),
      db.submissions.createMany({
        data: JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'submissions.json'), 'utf-8')),
      }),
      db.group_progress.createMany({
        data: JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'group_progress.json'), 'utf-8')),
      }),
      db.resource_types.createMany({
        data: JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'resource_types.json'), 'utf-8')),
      }),
      db.resource_tabs.createMany({
        data: JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'resource_tabs.json'), 'utf-8')),
      }),
      db.resources.createMany({
        data: JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'resources.json'), 'utf-8')),
      }),
    ])

    console.log('✅ All seeding completed successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

main()
  .then(() => {
    console.log('🎉 Database seeding finished!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error during seeding:', error)
    process.exit(1)
  })
