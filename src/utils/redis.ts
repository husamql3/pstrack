import { roadmap } from '@prisma/client'

import { redis } from '@/config/redis'

const CACHE_KEY = 'roadmap-data'

export const getCachedRoadmap = async () => {
  try {
    return await redis.get(CACHE_KEY)
  } catch (error) {
    console.error('Error fetching cached roadmap data:', error)
    return null
  }
}

export const updateCachedRoadmap = async (data: roadmap[]) => {
  try {
    await redis.set(CACHE_KEY, JSON.stringify(data), {
      ex: 3600, // Set expiration time to 1 hour (in seconds)
    })
  } catch (error) {
    console.error('Error updating cached roadmap data:', error)
  }
}
