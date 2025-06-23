import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  try {
    // Step 1: Ensure the backups folder exists
    const backupDir = path.resolve(process.cwd(), 'backup')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
      console.log(`Created backup directory: ${backupDir}`)
    }

    // Step 2: Fetch data from Prisma
    const [leetcoders, groups, roadmap, group_progress, submissions, resources, resource_tabs, resource_types] =
      await Promise.all([
        db.leetcoders.findMany(),
        db.groups.findMany(),
        db.roadmap.findMany(),
        db.group_progress.findMany(),
        db.submissions.findMany(),
        db.resources.findMany(),
        db.resource_tabs.findMany(),
        db.resource_types.findMany(),
      ])

    console.log('Fetched data:', {
      leetcoders: leetcoders.length,
      groups: groups.length,
      roadmap: roadmap.length,
      group_progress: group_progress.length,
      submissions: submissions.length,
      resources: resources.length,
      resource_tabs: resource_tabs.length,
      resource_types: resource_types.length,
    })

    // Step 3: Create backup directory with readable date
    const now = new Date()
    const formattedDate = now.toISOString().split('T')[0]
    const formattedTime = now.toTimeString().split(' ')[0].replace(/:/g, '-')
    const currentBackupDir = path.join(backupDir, `backup-${formattedDate}_${formattedTime}`)
    fs.mkdirSync(currentBackupDir, { recursive: true })

    // Step 4: Create individual JSON files for each model in the backup directory
    const models = {
      leetcoders,
      groups,
      roadmap,
      group_progress,
      submissions,
      resources,
      resource_tabs,
      resource_types,
    }

    console.log('Backup data:', {
      ...Object.keys(models).reduce((acc, key) => {
        return Object.assign(acc, {
          [key]: models[key as keyof typeof models].length,
        })
      }, {}),
    })

    // Save each model as a separate JSON file
    for (const [name, data] of Object.entries(models)) {
      const filePath = path.join(currentBackupDir, `${name}.json`)
      const jsonContent = JSON.stringify(data, null, 2)

      fs.writeFileSync(filePath, jsonContent)
      console.log(`Saved ${name} data to ${filePath}`)
    }

    console.log(`Backup completed to ${currentBackupDir}`)
  } catch (error) {
    console.error('Operation failed:', error)
    throw error
  }
}

main()
  .then(async () => {
    await db.$disconnect()
    console.log('Database disconnected')
  })
  .catch(async (error) => {
    console.error('Backup failed:', error)
    await db.$disconnect()
    process.exit(1)
  })
