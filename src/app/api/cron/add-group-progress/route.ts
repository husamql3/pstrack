import { NextResponse } from 'next/server'

import prisma from '@/prisma/prisma'
import { sendErrorEmailToAdmin } from '@/utils/sendErrorEmailToAdmin'

export async function GET() {
  try {
    await prisma.$connect()

    // get all group progress
    const allGroupProgress = await prisma.group_progress.findMany()

    const groupProgressMap = new Map()

    // add group progress if not exists
    allGroupProgress.forEach((record) => {
      const { group_no, current_problem } = record

      if (!groupProgressMap.has(group_no)) {
        groupProgressMap.set(group_no, current_problem)
      } else {
        const existingMax = groupProgressMap.get(group_no)
        if (current_problem > existingMax) {
          groupProgressMap.set(group_no, current_problem)
        }
      }
    })

    // add new group progress if not exists and update existing group progress
    for (const [group_no, current_problem] of groupProgressMap.entries()) {
      const newCurrentProblem = current_problem + 1

      await prisma.group_progress.create({
        data: {
          group_no,
          current_problem: newCurrentProblem,
        },
      })
    }

    return NextResponse.json({ success: true, data: 'group progress added' })
  } catch (error) {
    await sendErrorEmailToAdmin(error, 'GET /api/cron/add-group-progress')
    return NextResponse.json({
      success: false,
      error: 'add group progress cron job failed',
    })
  } finally {
    await prisma.$disconnect()
  }
}
