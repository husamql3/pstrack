import { type NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'

import { db } from '@/prisma/db'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'
import { fetchApprovedLeetcodersWithProblems } from '@/dao/leetcoder.dao'
import { env } from '@/config/env.mjs'
import { sendDailyProblemEmail } from '@/utils/email/sendDailyProblemEmail'

/**
 * Configuration for the serverless function
 * Specifies Node.js runtime and 60-second maximum execution time
 */
export const config = {
  runtime: 'nodejs',
  maxDuration: '60',
}

/**
 * API endpoint handler for sending daily LeetCode problems via email
 * Triggered by a scheduled cron job
 */
export async function GET(req: NextRequest) {
  // Verify request is authorized with correct secret key
  const secret = req.headers.get('X-Secret-Key')
  if (secret !== env.API_SECRET) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' })
  }

  try {
    await db.$connect()

    let totalSuccess = 0
    let totalFailed = 0

    // Fetch approved users and their assigned problems
    const { approvedLeetcoders, groupProblems } = await fetchApprovedLeetcodersWithProblems()

    // Use waitUntil to allow the function to continue processing after response is sent
    waitUntil(
      (async () => {
        // Iterate through each approved user
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
                email,
              })

              totalSuccess++
            } catch (error) {
              await sendAdminNotification({
                email: email,
                error: JSON.stringify(error),
                message: 'Queueing email in /api/cron/send-daily-problem-email',
              })
              totalFailed++
            }
          }
        }

        // Send admin notification with summary after all emails are processed
        await sendAdminNotification({
          message: '/api/cron/send-daily-problem-email',
          summary: JSON.stringify({
            total: approvedLeetcoders.length,
            successful: totalSuccess,
            failed: totalFailed,
          }),
        })
      })()
    )

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: approvedLeetcoders.length,
          successful: totalSuccess,
          failed: totalFailed,
        },
      },
    })
  } catch (error) {
    await sendAdminNotification({
      error: JSON.stringify(error),
      message: 'Error in /api/cron/send-daily-problem-email',
    })

    return NextResponse.json({ success: false, error: 'INTERNAL_SERVER_ERROR' })
  } finally {
    await db.$disconnect()
  }
}
