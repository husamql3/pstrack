import { NextResponse } from 'next/server'
import { group_progress } from '@prisma/client'

import prisma from '@/prisma/prisma'
import { sendErrorEmailToAdmin } from '@/utils/email/sendErrorEmailToAdmin'

/**
 * @route GET /api/cron/add-group-progress
 * works every day at 1am
 **/
export async function GET(req: Request) {
  try {
    const secret = req.headers.get('X-Secret-Key')
    if (secret !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'FUCK OFF' })
    }

    await prisma.$connect()

    // get all group progress
    const allGroupProgress: group_progress[] = await prisma.group_progress.findMany()

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
