import { NextResponse } from 'next/server'

import { env } from '@/config/env.mjs'
import { db } from '@/prisma/db'
import {
  getUniqueGroupNos,
  processLeetcoder,
  getAllLeetcoders,
  getAllAssignedProblems,
} from '@/utils/kickoutUtils'
import { UNSOLVED_THRESHOLD } from '@/data/constants'
import type { LeetcoderWithSubmissions } from '@/types/leetcoders.type'

// Types

// Main POST handler
export async function POST(req: Request) {
  // Verify the request
  const secret = req.headers.get('X-Secret-Key')
  if (secret !== env.API_SECRET) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const neglectedLeetcoders = await getAllLeetcoders()
    const groupNos = await getUniqueGroupNos(neglectedLeetcoders)
    const roadmapProblems = await getAllAssignedProblems(groupNos, neglectedLeetcoders)

    await Promise.all(
      neglectedLeetcoders.map((leetcoder: LeetcoderWithSubmissions) =>
        processLeetcoder(
          leetcoder,
          roadmapProblems.get(leetcoder.group_no) || [],
          UNSOLVED_THRESHOLD
        )
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST request error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  } finally {
    await db.$disconnect()
  }
}
