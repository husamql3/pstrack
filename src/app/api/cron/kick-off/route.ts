import { NextResponse } from 'next/server'

import prisma from '@/prisma/prisma'
import { getAllLeetcoders, processLeetcoder } from '@/prisma/dao/api/kickOff.dao'
import { sendAdminEmail } from '@/utils/email/sendAdminEmail'

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

    // await prisma.leetcoders.updateMany({
    //   data: { is_notified: false, status: 'APPROVED' },
    // })
    // return NextResponse.json({
    //   success: true,
    //   data: 'Neglected Leetcoders kicked off successfully',
    // })

    // get all leetcoders
    const leetcoders = await getAllLeetcoders()

    for (const leetcoder of leetcoders) {
      await processLeetcoder(leetcoder)
    }
    // await sendAdminEmail(neglectedLeetcoders, 'Neglected Leetcoders')
    return NextResponse.json({
      success: true,
      data: 'Neglected Leetcoders kicked off successfully',
    })
  } catch (error) {
    console.error(error)
    await sendAdminEmail(error, 'GET /api/cron/kick-off')

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
