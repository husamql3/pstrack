import { ResourceTab } from '@prisma/client'

import { db } from '@/prisma/db'
import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { REDIS_KEYS } from '@/data/constants'
import { logger } from '@/utils/logger'
import { redis } from '@/config/redis'
import { ResourcesResponse } from '@/types/resources.type'
import { groupByTopic } from '@/utils/resources'

export const resourcesRouter = createTRPCRouter({
  /**
   * Get all resources grouped by topic for `/resources` page
   * Returns separate arrays for technologies and problem solving
   * - revalidates every 24 hours
   * @returns {ResourcesResponse}
   */
  getResources: publicProcedure.query(async (): Promise<ResourcesResponse> => {
    try {
      const cachedResources = await redis.get(REDIS_KEYS.RESOURCES)
      if (cachedResources && typeof cachedResources === 'string') {
        logger.debug(`[Cache] Using cached resources`)
        return JSON.parse(cachedResources) as ResourcesResponse
      }
    } catch (error) {
      logger.warn(`[Cache] Failed to retrieve cached resources:`, error)
    }

    const resources = await db.resources.findMany({
      where: {
        is_visible: true,
        is_approved: true,
      },
      orderBy: [{ created_at: 'asc' }],
    })

    const techResources = resources.filter((resource) => resource.tab === ResourceTab.TECHNOLOGIES)
    const psResources = resources.filter((resource) => resource.tab === ResourceTab.PROBLEM_SOLVING)

    const response: ResourcesResponse = {
      technologies: groupByTopic(techResources),
      problemSolving: groupByTopic(psResources),
    }

    // Cache the response
    try {
      await redis.set(REDIS_KEYS.RESOURCES, JSON.stringify(response), { ex: 60 * 60 * 24 }) // 24 hours
    } catch (error) {
      logger.warn(`[Cache] Failed to cache resources:`, error)
    }

    return response
  }),

  // add a new resource
  // approve a resource - invalidate cache
  // hide a resource
})
