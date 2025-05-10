import { serve } from '@upstash/workflow/nextjs'

import { db } from '@/prisma/db'
import { BATCH_SIZE, DELAY_MS } from '@/data/constants'
import { fetchApprovedLeetcodersWithProblems } from '@/dao/leetcoder.dao'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'
import { sendDailyProblemEmail } from '@/utils/email/sendDailyProblemEmail'

// Configure the workflow with QStash
export const { POST } = serve(async (context) => {
  try {
    let totalSuccess = 0
    let totalFailed = 0

    // Step 1: Connect to database and fetch approved users and their assigned problems
    const { approvedLeetcoders, groupProblems } = await context.run('fetch-leetcoders', async () => {
      await db.$connect()
      return await fetchApprovedLeetcodersWithProblems()
    })

    // Step 2: Process users in batches and send emails
    const emailResults = await context.run('send-emails', async () => {
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
                event: 'DAILY_PROBLEM_EMAIL',
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

      return {
        totalSuccess,
        totalFailed,
        total: approvedLeetcoders.length,
      }
    })

    // Step 3: Send summary notification
    await context.run('send-summary', async () => {
      // Send admin notification with summary after all emails are processed
      await sendAdminNotification({
        event: 'DAILY_PROBLEM_EMAIL_SUMMARY',
        message: '/api/workflow/daily-problem-email',
        summary: JSON.stringify({
          total: emailResults.total,
          successful: emailResults.totalSuccess,
          failed: emailResults.totalFailed,
        }),
      })

      return {
        success: true,
        summary: {
          total: emailResults.total,
          successful: emailResults.totalSuccess,
          failed: emailResults.totalFailed,
        },
      }
    })

    // Step 4: Disconnect from database
    await context.run('cleanup', async () => {
      await db.$disconnect()
      return { success: true }
    })

    return {
      success: true,
      data: {
        summary: {
          total: emailResults.total,
          successful: emailResults.totalSuccess,
          failed: emailResults.totalFailed,
        },
      },
    }
  } catch (error) {
    // Handle errors inside a context.run to ensure database disconnection
    await context.run('error-handling', async () => {
      await sendAdminNotification({
        event: 'DAILY_PROBLEM_EMAIL_WORKFLOW_ERROR',
        error: JSON.stringify(error),
        message: 'Error in /api/workflow daily problem email',
      })

      // Ensure database is disconnected even on error
      await db.$disconnect()
      return { success: false }
    })

    return { success: false, error: 'INTERNAL_SERVER_ERROR' }
  }
})
