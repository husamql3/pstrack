import { type NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'

import { env } from '@/config/env.mjs'
import { db } from '@/prisma/db'
import {
  getUniqueGroupNos,
  getAllLeetcoders,
  getAllAssignedProblems,
  getSolvedProblems,
  calculateUnsolvedProblems,
  kickOffLeetcoders,
  updateIsNotified,
} from '@/utils/kickoutUtils'
import { BATCH_SIZE, DELAY_MS, LIMIT, UNSOLVED_THRESHOLD } from '@/data/constants'
import type { LeetcoderWithSubmissions } from '@/types/leetcoders.type'
import { sendReminderEmail } from '@/utils/email/sendReminderEmail'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'

/**
 * Configuration for the serverless function
 * Specifies Node.js runtime and 60-second maximum execution time
 */
export const config = {
  runtime: 'nodejs',
  maxDuration: '60',
}

export async function POST(req: NextRequest) {
  // Verify the request
  const secret = req.headers.get('X-Secret-Key')
  if (secret !== env.API_SECRET) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    await db.$connect()

    let totalSuccess = 0
    let totalFailed = 0
    let totalNotified = 0
    let totalKicked = 0

    const neglectedLeetcoders = await getAllLeetcoders()
    const groupNos = await getUniqueGroupNos(neglectedLeetcoders)
    const roadmapProblems = await getAllAssignedProblems(groupNos, neglectedLeetcoders)
    console.log(neglectedLeetcoders)

    waitUntil(
      (async () => {
        // Process leetcoders in batches
        for (let i = 0; i < neglectedLeetcoders.length; i += BATCH_SIZE) {
          const batch = neglectedLeetcoders.slice(i, i + BATCH_SIZE)

          // Process each leetcoder with concurrency limit
          await Promise.all(
            batch.map(async (leetcoder: LeetcoderWithSubmissions) => {
              try {
                await LIMIT(() =>
                  processLeetcoder(leetcoder, roadmapProblems.get(leetcoder.group_no) || [], UNSOLVED_THRESHOLD)
                )
                totalSuccess++

                // Track specific actions
                if (leetcoder.is_notified) {
                  totalKicked++
                } else {
                  totalNotified++
                }
              } catch (error) {
                await sendAdminNotification({
                  event: 'KICK_OUT_PROCESSING_ERROR',
                  email: leetcoder.email,
                  error: JSON.stringify(error),
                  leetcoderId: leetcoder.id,
                })
                totalFailed++
              }
            })
          )

          // Add delay between batches (skip for the last batch)
          if (i + BATCH_SIZE < neglectedLeetcoders.length) {
            await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
          }
        }
      })()
    )

    // Send admin notification with detailed summary
    await sendAdminNotification({
      event: 'KICK_OUT_SUMMARY',
      message: '/api/cron/kick-out',
      summary: JSON.stringify({
        total: neglectedLeetcoders.length,
        successful: totalSuccess,
        failed: totalFailed,
        notified: totalNotified,
        kicked: totalKicked,
      }),
    })

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: neglectedLeetcoders.length,
          successful: totalSuccess,
          failed: totalFailed,
          notified: totalNotified,
          kicked: totalKicked,
        },
      },
    })
  } catch (error) {
    await sendAdminNotification({
      event: 'KICK_OUT_CRON_ERROR',
      error: JSON.stringify(error),
      message: 'Error in /api/cron/kick-out',
    })

    return NextResponse.json({ success: false, error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  } finally {
    await db.$disconnect()
  }
}

export const processLeetcoder = async (
  leetcoder: LeetcoderWithSubmissions,
  assignedProblems: { id: string }[],
  unsolvedThreshold: number
): Promise<void> => {
  if (assignedProblems.length < unsolvedThreshold) return

  const solvedProblems = getSolvedProblems(leetcoder)
  const unsolvedProblems = calculateUnsolvedProblems(assignedProblems, solvedProblems)

  if (unsolvedProblems.length > unsolvedThreshold) {
    if (leetcoder.is_notified) {
      await kickOffLeetcoders(leetcoder.id)
    } else {
      try {
        // Send reminder email first
        await sendReminderEmail({
          group_no: String(leetcoder.group_no),
          email: leetcoder.email,
        })

        // Only update notification status if email was sent successfully
        await updateIsNotified(leetcoder.id)
      } catch (error) {
        // Log the specific error and rethrow
        console.error(`Failed to process leetcoder ${leetcoder.id}:`, error)
        throw error
      }
    }
  }
}
