import { NextResponse } from 'next/server'

import { redis } from '@/config/redis'
import { sendAdminNotification } from '@/utils/email/sendEmail'

export async function POST() {
  try {
    // Delete the cache for this group
    const cacheKey = 'roadmap:data'
    await redis.del(cacheKey)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error invalidating cache:', error)

    // Notify admin about the error
    await sendAdminNotification({
      operation: 'cache-invalidation-roadmap',
      errorMessage: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Failed to invalidate cache' }, { status: 500 })
  }
}
