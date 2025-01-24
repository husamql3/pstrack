import { NextResponse } from 'next/server'

import prisma from '@/prisma/prisma'
import {
  getAllLeetcoders,
  kickOffLeetcoders,
  updateIsNotified,
} from '@/prisma/dao/api/kickOff.dao'
import { sendSolveProblemsRemider } from '@/utils/email/sendSolveProblemsRemider'
import { sendErrorEmailToAdmin } from '@/utils/email/sendErrorEmailToAdmin'

/**
 * @route GET /api/cron/kick-off
 * works every day at 6am
 **/
export async function GET(req: Request) {
  try {
    const secret = req.headers.get('X-Secret-Key')
    if (secret !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'FUCK OFF' })
    }

    await prisma.$connect()

    // get all leetcoders
    const leetcoders = await getAllLeetcoders()

    // filter leetcoders who have less than 5 submissions
    const neglectedLeetcoders = leetcoders.filter(
      (leetcoder) => leetcoder.submissions.length <= 5
    )

    for (const leetcoder of neglectedLeetcoders) {
      if (leetcoder.is_notified) {
        // if the leetcoder has been notified, kick off
        await kickOffLeetcoders(leetcoder.id)
      } else {
        // if the leetcoder has not been notified, send email
        await sendSolveProblemsRemider({
          to: leetcoder.email,
          group_no: String(leetcoder.group_no),
        })
        await updateIsNotified(leetcoder.id)
      }
    }

    return NextResponse.json({
      success: true,
      data: neglectedLeetcoders,
    })
  } catch (error) {
    console.error(error)
    await sendErrorEmailToAdmin(error, 'GET /api/cron/kick-off')

    return NextResponse.json(
      {
        success: false,
        error: 'kick-off cron job failed error',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
