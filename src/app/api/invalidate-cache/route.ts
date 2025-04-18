import { NextResponse } from 'next/server'

import { redis } from '@/config/redis'

export async function POST(request: Request) {
  try {
    const { groupId } = await request.json()

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Delete the cache for this group
    const cacheKey = `group:${groupId}:data`
    await redis.del(cacheKey)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error invalidating cache:', error)
    return NextResponse.json({ error: 'Failed to invalidate cache' }, { status: 500 })
  }
}
