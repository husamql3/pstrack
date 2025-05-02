import { NextResponse } from 'next/server'

import { db } from '@/prisma/db'
import { env } from '@/config/env.mjs'
import { NOT_STARTED_GROUPS } from '@/data/constants'

/**
 * GET handler for automated progression of group problems
 * This endpoint is designed to be called by a CRON job to advance all groups to the next problem
 */
export async function GET(req: Request) {
  // Verify the request is coming from an authorized source
  const secret = req.headers.get('X-Secret-Key')
  if (secret !== env.API_SECRET) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' })
  }

  try {
    await db.$disconnect()

    // Fetch group progress records from the database, excluding NOT_STARTED_GROUPS
    const allGroupProgress = await db.group_progress.findMany({
      where: {
        group_no: {
          notIn: NOT_STARTED_GROUPS,
        },
      },
    })

    // Create a map to track the highest problem number for each group
    const groupProgressMap = new Map()
    for (const record of allGroupProgress) {
      const { group_no, current_problem } = record

      // If this is the first record for this group, add it to the map
      if (!groupProgressMap.has(group_no)) {
        groupProgressMap.set(group_no, current_problem)
      } else {
        // If we already have a record for this group, keep only the highest problem number
        const existingMax = groupProgressMap.get(group_no)
        if (current_problem > existingMax) {
          groupProgressMap.set(group_no, current_problem)
        }
      }
    }

    // For each group, create a new progress record advancing to the next problem
    for (const [group_no, current_problem] of groupProgressMap.entries()) {
      const newCurrentProblem = current_problem + 1
      await db.group_progress.create({
        data: {
          group_no,
          current_problem: newCurrentProblem,
        },
      })
    }

    return NextResponse.json({ success: true, data: 'group progress added' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' })
  } finally {
    await db.$disconnect()
  }
}
