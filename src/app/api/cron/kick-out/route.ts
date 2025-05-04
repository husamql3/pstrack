import pLimit from 'p-limit'
import { NextResponse } from 'next/server'

import { env } from '@/config/env.mjs'
import { db } from '@/prisma/db'
import { getUniqueGroupNos, processLeetcoder, getAllLeetcoders, getAllAssignedProblems } from '@/utils/kickoutUtils'
import { UNSOLVED_THRESHOLD } from '@/data/constants'
import type { LeetcoderWithSubmissions } from '@/types/leetcoders.type'

// Configure throttling and rate limiting
const batchSize = 20 // Process 20 leetcoders per batch
const delayMs = 1000 // 1-second delay between batches
const limit = pLimit(5) // Limit to 5 concurrent operations

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

    // Process leetcoders in batches
    for (let i = 0; i < neglectedLeetcoders.length; i += batchSize) {
      const batch = neglectedLeetcoders.slice(i, i + batchSize)

      // Process each leetcoder with concurrency limit
      await Promise.all(
        batch.map((leetcoder: LeetcoderWithSubmissions) =>
          limit(() => processLeetcoder(leetcoder, roadmapProblems.get(leetcoder.group_no) || [], UNSOLVED_THRESHOLD))
        )
      )

      // Add delay between batches (skip for the last batch)
      if (i + batchSize < neglectedLeetcoders.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST request error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  } finally {
    await db.$disconnect()
  }
}
