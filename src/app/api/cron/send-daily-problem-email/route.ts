import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'

import prisma from '@/prisma/prisma'
import { sendDailyProblemEmail } from '@/utils/email/sendDailyProblemEmail'
import { sendAdminEmail } from '@/utils/email/sendAdminEmail'
import { EmailLog } from '@/types/sendEmail.type'

export const config = {
  runtime: 'nodejs',
  maxDuration: '10',
}

/**
 * @route GET /api/cron/send-daily-problem-email
 * works every day at 6am
 **/
export async function GET(req: NextRequest) {
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
    const approvedLeetcoders = await prisma.leetcoders.findMany({
      where: {
        status: 'APPROVED',
      },
      include: {
        group: true, // Include group details
      },
    })

    const emailLogs: EmailLog[] = []
    let totalSuccess = 0
    let totalFailed = 0

    waitUntil(
      (async () => {
        // Wrap the email sending logic in an async function
        try {
          for (const leetcoder of approvedLeetcoders) {
            const { email, group } = leetcoder
            const problem = groupProblems.get(group.group_no)

            if (problem) {
              try {
                await sendDailyProblemEmail({
                  problem_slug: problem.problem_slug,
                  difficulty: problem.difficulty,
                  topic: problem.topic,
                  group_no: group.group_no.toString(),
                  email: email,
                })
                emailLogs.push({
                  email,
                  status: 'success',
                })
                totalSuccess++
              } catch (error) {
                await sendAdminEmail(error, 'waitUntil block in /api/cron/send-daily-problem-email')
                emailLogs.push({
                  email,
                  status: 'failed',
                  error: error instanceof Error ? error.message : 'Unknown error',
                })
                totalFailed++
              }
            }
          }
        } catch (error) {
          await sendAdminEmail(error, 'waitUntil block in /api/cron/send-daily-problem-email')
        }
      })()
    )

    await sendAdminEmail(
      {
        summary: {
          total: totalSuccess + totalFailed,
          successful: totalSuccess,
          failed: totalFailed,
        },
        logs: emailLogs,
      },
      '/api/cron/send-daily-problem-email'
    )
    return NextResponse.json({
      success: totalFailed === 0,
      data: {
        summary: {
          total: totalSuccess + totalFailed,
          successful: totalSuccess,
          failed: totalFailed,
        },
        logs: emailLogs,
      },
    })
  } catch (error) {
    await sendAdminEmail(error, 'GET /api/cron/send-daily-problem-email')
    return NextResponse.json({
      success: false,
      error: 'Failed to send daily problem emails',
    })
  } finally {
    await prisma.$disconnect()
  }
}
