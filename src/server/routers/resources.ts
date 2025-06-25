import type { Prisma, resources } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
// import { redis } from '@/config/redis'
import { ADMINS_EMAILS } from '@/data/constants'
import { db } from '@/prisma/db'
import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import type { ResourcesResponse, ResourceTabOption, ResourceTypeOption } from '@/types/resources.type'
import { AddNewResourceSchema } from '@/types/schema/resources.schema'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'
import { logger } from '@/utils/logger'
import { formatTabLabel, groupByTopic } from '@/utils/resources'

export const resourcesRouter = createTRPCRouter({
  /**
   * Get all resources grouped by topic for `/resources` page
   * Returns separate arrays for technologies and problem solving
   * Revalidates every 24 hours
   * @returns {ResourcesResponse}
   */
  getResources: publicProcedure.query(async (): Promise<ResourcesResponse> => {
    // const cachedResources = (await redis.get(REDIS_KEYS.RESOURCES)) as ResourcesResponse | null
    // if (cachedResources) {
    //   logger.debug('[Cache] Using cached resources')
    //   return cachedResources
    // }

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
      technologies: groupByTopic(
        techResources.map((r) => ({
          ...r,
          type: r.type.name,
          tab: r.tab.name,
        }))
      ),
      problemSolving: groupByTopic(psResources.map((r) => ({ ...r, type: r.type.name, tab: r.tab.name }))),
    }

    // await redis.set(REDIS_KEYS.RESOURCES, response, { ex: 900 }) // cache for 15 minutes
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
  addResource: publicProcedure
    .input(AddNewResourceSchema)
    .mutation(async ({ input, ctx }): Promise<resources | null> => {
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

        await sendAdminNotification({
          event: 'NEW_RESOURCE_SUBMITTED',
          email: ctx.user?.leetcoder?.email as string,
          message: `New resource submitted: ${input.title}`,
        })

        return resource
      } catch (error) {
        logger.error(`Failed to create resource: ${error}`)
        return null
      }
    }),

  /**
   * Get all resources for admin with pagination and filtering
   * Only admins can access this
   */
  getAllResourcesAdmin: publicProcedure
    .input(
      z.object({
        page: z.number().optional().default(1),
        limit: z.number().optional().default(50),
        showPendingOnly: z.boolean().optional().default(false),
        tabFilter: z.string().optional(),
        typeFilter: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check admin permissions
      if (ctx.user?.email && !ADMINS_EMAILS.includes(ctx.user.email)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Only admin can access this resource',
        })
      }

      const { page, limit, showPendingOnly, tabFilter, typeFilter, search } = input
      const skip = (page - 1) * limit

      const whereClause: Prisma.resourcesWhereInput = {}

      if (showPendingOnly) {
        whereClause.is_visible = false
        whereClause.is_approved = false
      }

      // Fix: Use the actual database values, not the formatted labels
      if (tabFilter && tabFilter !== 'all') {
        // Convert formatted label back to database value
        const tabName = tabFilter.toUpperCase().replace(' ', '_')
        whereClause.tab = { name: tabName }
      }

      if (typeFilter && typeFilter !== 'all') {
        // Convert formatted label back to database value
        const typeName = typeFilter.toLowerCase()
        whereClause.type = { name: typeName }
      }

      if (search && search.trim() !== '') {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { topic: { contains: search, mode: 'insensitive' } },
          { contributor: { contains: search, mode: 'insensitive' } },
        ]
      }

      const [resources, totalCount] = await Promise.all([
        db.resources.findMany({
          where: whereClause,
          include: {
            type: true,
            tab: true,
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        db.resources.count({ where: whereClause }),
      ])

      return {
        resources,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      }
    }),

  /**
   * Update resource admin actions (approve, visibility, etc.)
   */
  updateResourceAdmin: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        is_approved: z.boolean().optional(),
        is_visible: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check admin permissions
      if (ctx.user?.email && !ADMINS_EMAILS.includes(ctx.user.email)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Only admin can access this resource',
        })
      }

      const { id, ...updates } = input

      return db.resources.update({
        where: { id },
        data: updates,
      })
    }),

  /**
   * Delete resource (admin only)
   */
  deleteResourceAdmin: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input, ctx }) => {
    // Check admin permissions
    if (ctx.user?.email && !ADMINS_EMAILS.includes(ctx.user.email)) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Only admin can access this resource',
      })
    }

    return db.resources.delete({
      where: { id: input.id },
    })
  }),
})
