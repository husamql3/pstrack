import { db } from '@/prisma/db'
import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { REDIS_KEYS } from '@/data/constants'
import { logger } from '@/utils/logger'
import { redis } from '@/config/redis'
import type { ResourcesResponse, ResourceTabOption, ResourceTypeOption } from '@/types/resources.type'
import { formatTabLabel, groupByTopic } from '@/utils/resources'
import { AddNewResourceSchema } from '@/types/schema/resources.schema'
import { resources } from '@prisma/client'

export const resourcesRouter = createTRPCRouter({
  /**
   * Get all resources grouped by topic for `/resources` page
   * Returns separate arrays for technologies and problem solving
   * Revalidates every 24 hours
   * @returns {ResourcesResponse}
   */
  getResources: publicProcedure.query(async (): Promise<ResourcesResponse> => {
    const cachedResources = (await redis.get(REDIS_KEYS.RESOURCES)) as ResourcesResponse | null
    if (cachedResources) {
      logger.debug('[Cache] Using cached resources')
      return cachedResources
    }

    const resources = await db.resources.findMany({
      where: {
        is_visible: true,
        is_approved: true,
      },
      include: {
        type: true,
        tab: true,
      },
      orderBy: [{ created_at: 'asc' }],
    })

    const resourcesByTab = resources.reduce(
      (acc, resource) => {
        const tabName = resource.tab.name
        if (!acc[tabName]) {
          acc[tabName] = []
        }
        acc[tabName].push(resource)
        return acc
      },
      {} as Record<string, typeof resources>
    )

    const techResources = resourcesByTab['TECHNOLOGIES'] || []
    const psResources = resourcesByTab['PROBLEM_SOLVING'] || []

    const response: ResourcesResponse = {
      technologies: groupByTopic(techResources.map((r) => ({ ...r, type: r.type.name, tab: r.tab.name }))),
      problemSolving: groupByTopic(psResources.map((r) => ({ ...r, type: r.type.name, tab: r.tab.name }))),
    }

    await redis.set(REDIS_KEYS.RESOURCES, response, { ex: 60 * 60 * 24 }) // 24 hours
    return response
  }),

  /**
   * Get all resource tabs for the dropdown
   * @returns {ResourceTabOption[]}
   */
  getResourceTabs: publicProcedure.query(async (): Promise<ResourceTabOption[]> => {
    try {
      const tabs = await db.resource_tabs.findMany({
        orderBy: { name: 'asc' },
      })

      return tabs.map((tab) => ({
        value: tab.id,
        label: formatTabLabel(tab.name),
      }))
    } catch (error) {
      logger.error(`Failed to get resource tabs: ${error}`)
      return []
    }
  }),

  /**
   * Get all resource types for the dropdown
   * @returns {ResourceTypeOption[]}
   */
  getResourceTypes: publicProcedure.query(async (): Promise<ResourceTypeOption[]> => {
    try {
      const types = await db.resource_types.findMany({
        orderBy: { name: 'asc' },
      })

      return types.map((type) => ({
        value: type.id,
        label: formatTabLabel(type.name),
      }))
    } catch (error) {
      logger.error(`Failed to get resource types: ${error}`)
      return []
    }
  }),

  getResourceTopics: publicProcedure.query(async (): Promise<{ topic: string }[]> => {
    try {
      return db.resources.findMany({
        distinct: ['topic'],
        select: {
          topic: true,
        },
        orderBy: {
          topic: 'asc',
        },
      })
    } catch (error) {
      logger.error(`Failed to get resource topics: ${error}`)
      return []
    }
  }),

  /**
   * Add a new resource
   * @param {AddNewResourceSchemaType} input
   * @returns {Resource | null}
   */
  addResource: publicProcedure.input(AddNewResourceSchema).mutation(async ({ input }): Promise<resources | null> => {
    try {
      const resource = await db.resources.create({
        data: {
          title: input.title,
          url: input.url,
          type_id: Number(input.type),
          tab_id: Number(input.tab),
          contributor: input.contributor ?? '',
          topic: input.topic,
          is_visible: false,
          is_approved: false,
        },
      })

      return resource
    } catch (error) {
      logger.error(`Failed to create resource: ${error}`)
      return null
    }
  }),
})
