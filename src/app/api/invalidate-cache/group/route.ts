import { NextResponse } from 'next/server'

import { redis } from '@/config/redis'
import { sendAdminNotification } from '@/utils/email/sendEmail'

export async function POST(request: Request) {
  const { groupId } = await request.json()
  if (!groupId) {
    return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
  }

  try {
    // Delete the cache for this group
    const cacheKey = `group:${groupId}:data`
    await redis.del(cacheKey)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error invalidating cache:', error)

    // Notify admin about the error
    await sendAdminNotification({
      operation: 'cache-invalidation',
      errorMessage: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      groupId: groupId || 'unknown',
    })

    return NextResponse.json({ error: 'Failed to invalidate cache' }, { status: 500 })
  }
}
