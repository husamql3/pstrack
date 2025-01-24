import { NextResponse } from 'next/server'

import prisma from '@/prisma/prisma'
import { sendDailyProblemEmail } from '@/utils/email/sendDailyProblemEmail'
import { sendErrorEmailToAdmin } from '@/utils/email/sendErrorEmailToAdmin'

/**
 * @route GET /api/cron/send-daily-problem-email
 * works every day at 6am
 **/
export async function GET(req: Request) {
  try {
    const secret = req.headers.get('X-Secret-Key')
    if (secret !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'FUCK OFF' })
    }

    await prisma.$connect()

    // Fetch all groups with their latest progress
    const groups = await prisma.groups.findMany({
      include: {
        group_progress: {
          orderBy: {
            created_at: 'desc', // Get the latest progress for each group
          },
          take: 1, // Only fetch the latest progress
        },
      },
    })

    // Fetch today's problem for each group
    const groupProblems = new Map()

    for (const group of groups) {
      const latestProgress = group.group_progress[0]

      if (latestProgress) {
        // Fetch the problem details from the roadmap
        const problem = await prisma.roadmap.findUnique({
          where: {
            problem_order: latestProgress.current_problem,
          },
        })

        if (problem) {
          // Store the problem details for this group
          groupProblems.set(group.group_no, problem)
        }
      }
    }

    // Fetch all APPROVED leetcoders
    const APPROVEDLeetcoders = await prisma.leetcoders.findMany({
      where: {
        status: 'APPROVED',
      },
      include: {
        group: true, // Include group details
      },
    })

    for (const leetcoder of APPROVEDLeetcoders) {
      const { email, group } = leetcoder

      const problem = groupProblems.get(group.group_no)

      if (problem) {
        // Send the daily problem email
        const res = await sendDailyProblemEmail({
          problem_slug: problem.problem_slug,
          difficulty: problem.difficulty,
          topic: problem.topic,
          group_no: group.group_no.toString(),
          email: email,
        })

        console.log(`Email sent to ${email}:`, res)
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: 'Daily problem emails sent successfully',
    })
  } catch (error) {
    await sendErrorEmailToAdmin(error, 'GET /api/cron/send-daily-problem-email')
    return NextResponse.json({
      success: false,
      error: 'Failed to send daily problem emails',
    })
  } finally {
    await prisma.$disconnect()
  }
}
