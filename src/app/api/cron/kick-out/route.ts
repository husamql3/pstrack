import { NextResponse } from 'next/server'

import { db } from '@/prisma/db'
import { env } from '@/config/env.mjs'
import {
  getNeglectedLeetcoders,
  type NeglectedLeetcoder,
  updateLeetcoderNotificationStatus,
  suspendLeetcoder,
} from '@/dao/kick-off.dao'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'
import { BATCH_SIZE, DELAY_MS } from '@/data/constants'

export async function POST(req: Request) {
  const secret = req.headers.get('X-Secret-Key')
  if (secret !== env.API_SECRET) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    await db.$connect()

    const neglectedLeetcoders = await getNeglectedLeetcoders()
    const notified: NeglectedLeetcoder[] = []
    const suspended: NeglectedLeetcoder[] = []
    const errors: string[] = []

    for (let i = 0; i < neglectedLeetcoders.length; i += BATCH_SIZE) {
      const batch = neglectedLeetcoders.slice(i, i + BATCH_SIZE)

      const results = await Promise.all(batch.map((leetcoder) => processLeetcoder(leetcoder)))

      // Process results
      results.forEach((result) => {
        if (result.notified) notified.push(result.notified)
        if (result.suspended) suspended.push(result.suspended)
        if (result.error) errors.push(result.error)
      })

      // Add delay between batches
      if (i + BATCH_SIZE < neglectedLeetcoders.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
      }
    }

    await sendAdminNotification({
      event: 'KICKOFF',
      message: 'Kick-off process completed successfully',
      errors: JSON.stringify(errors),
      notified: JSON.stringify(notified),
      suspended: JSON.stringify(suspended),
    })

    return NextResponse.json({
      success: true,
      message: 'Kick-off process completed successfully',
    })
  } catch (error) {
    await sendAdminNotification({
      event: 'KICKOFF',
      message: 'Kick-off failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      {
        success: false,
        error: 'kick-off cron job failed error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

async function processLeetcoder(leetcoder: NeglectedLeetcoder): Promise<{
  notified?: NeglectedLeetcoder
  suspended?: NeglectedLeetcoder
  error?: string
}> {
  try {
    if (!leetcoder.is_notified) {
      // First time being neglected - notify them
      const updated = await updateLeetcoderNotificationStatus(
        leetcoder.id,
        true,
        leetcoder.email,
        String(leetcoder.group_no)
      )
      if (updated) {
        return { notified: { ...leetcoder, is_notified: true } }
      } else {
        return { error: `Failed to notify leetcoder: ${leetcoder.lc_username}` }
      }
    } else {
      // Already notified - suspend them
      const suspended_leetcoder = await suspendLeetcoder(leetcoder.id)
      if (suspended_leetcoder) {
        return { suspended: { ...leetcoder, status: 'SUSPENDED' } }
      } else {
        return { error: `Failed to suspend leetcoder: ${leetcoder.lc_username}` }
      }
    }
  } catch (error) {
    console.error(`Error processing leetcoder ${leetcoder.lc_username}:`, error)
    return { error: `Error processing leetcoder ${leetcoder.lc_username}: ${error}` }
  }
}
