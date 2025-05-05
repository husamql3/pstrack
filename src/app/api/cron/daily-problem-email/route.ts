import { type NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'

import { db } from '@/prisma/db'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'
import { fetchApprovedLeetcodersWithProblems } from '@/dao/leetcoder.dao'
import { env } from '@/config/env.mjs'
import { sendDailyProblemEmail } from '@/utils/email/sendDailyProblemEmail'
import { BATCH_SIZE, DELAY_MS } from '@/data/constants'

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
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    await db.$connect()

    let totalSuccess = 0
    let totalFailed = 0

    // Fetch approved users and their assigned problems
    const { approvedLeetcoders, groupProblems } = await fetchApprovedLeetcodersWithProblems()

    waitUntil(
      (async () => {
        // Process leetcoders in batches
        for (let i = 0; i < approvedLeetcoders.length; i += BATCH_SIZE) {
          const batch = approvedLeetcoders.slice(i, i + BATCH_SIZE)

          // Process each leetcoder in the batch
          for (const leetcoder of batch) {
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
                  event: 'DAILY_PROBLEM_EMAIL_QUEUE_ERROR',
                  message: 'Queueing email in /api/cron/send-daily-problem-email',
                  email: email,
                  error: JSON.stringify(error),
                })
                totalFailed++
              }
            }
          }

          // Add delay between batches (skip for the last batch)
          if (i + BATCH_SIZE < approvedLeetcoders.length) {
            await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
          }
        }
      })()
    )
    // Send admin notification with summary after all emails are processed
    await sendAdminNotification({
      event: 'DAILY_PROBLEM_EMAIL_SUMMARY',
      message: '/api/cron/send-daily-problem-email',
      summary: JSON.stringify({
        total: approvedLeetcoders.length,
        successful: totalSuccess,
        failed: totalFailed,
      }),
    })

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
      event: 'DAILY_PROBLEM_EMAIL_CRON_ERROR',
      error: JSON.stringify(error),
      message: 'Error in /api/cron/send-daily-problem-email',
    })

    return NextResponse.json({ success: false, error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  } finally {
    await db.$disconnect()
  }
}
