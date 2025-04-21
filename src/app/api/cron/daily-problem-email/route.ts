import { type NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'

import { db } from '@/prisma/db'
import { initRabbitMQ } from '@/config/rabbitmq'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'
import { fetchApprovedLeetcodersWithProblems } from '@/dao/leetcoder.dao'
import { env } from '@/config/env.mjs'

type EmailLog = {
  email: string
  status: 'queued' | 'failed'
  error?: string
}

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

  // Initialize RabbitMQ connection with the email queue
  const queue = 'daily_problem_email_queue'
  const { connection, channel } = await initRabbitMQ(queue)

  try {
    await db.$connect()

    const emailLogs: EmailLog[] = []
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
              // Prepare email data with problem details
              const emailData = {
                problem_slug: problem.problem_slug,
                difficulty: problem.difficulty,
                topic: problem.topic,
                group_no: group.group_no.toString(),
                email,
              }

              // Add email task to RabbitMQ queue with persistence enabled
              channel.sendToQueue(queue, Buffer.from(JSON.stringify(emailData)), {
                persistent: true,
              })

              emailLogs.push({ email, status: 'queued' })
              totalSuccess++
            } catch (error) {
              await sendAdminNotification({
                email: email,
                error: JSON.stringify(error),
                message: 'Queueing email in /api/cron/send-daily-problem-email',
              })
              emailLogs.push({
                email,
                status: 'failed',
                error: JSON.stringify(error),
              })
              totalFailed++
            }
          }
        }
      })()
    )

    await sendAdminNotification({
      message: '/api/cron/send-daily-problem-email',
      summary: JSON.stringify({
        total: totalSuccess + totalFailed,
        successful: totalSuccess,
        failed: totalFailed,
      }),
      logs: JSON.stringify(emailLogs),
    })

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
    await sendAdminNotification({
      error: JSON.stringify(error),
      message: 'Error in /api/cron/send-daily-problem-email',
    })

    return NextResponse.json({ success: false, error: 'INTERNAL_SERVER_ERROR' })
  } finally {
    // Clean up resources regardless of success or failure
    await channel.close()
    await connection.close()
    await db.$disconnect()
  }
}
