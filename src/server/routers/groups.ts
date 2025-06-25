import type { groups } from '@prisma/client'
import { z } from 'zod/v4'
import { redis } from '@/config/redis'
import { MAX_LEETCODERS, REDIS_KEYS } from '@/data/constants'
import { db } from '@/prisma/db'
import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import type { GetAllGroupsInfoType, GroupTableDataType } from '@/trpc/groups.type'
import { logger } from '@/utils/logger'

export const groupsRouter = createTRPCRouter({
  /**
   * Get group table data for /group/[groupId] page
   * - revalidates every 24 hours
   * - on each leetcoder submission, the cache is invalidated
   * @returns {GroupTableDataType}
   */
  getGroupTableData: publicProcedure
    .input(z.object({ group_no: z.string().transform((val) => Number(val)) }))
    .query(async ({ input }): Promise<GroupTableDataType> => {
      const cachedGroupData = (await redis.get(
        REDIS_KEYS.GROUP_DATA(input.group_no.toString())
      )) as GroupTableDataType | null
      if (cachedGroupData) {
        logger.debug(`[Cache] Using cached group data for group ${input.group_no}`)
        return cachedGroupData
      }

      const groupData = await db.groups.findUnique({
        where: {
          group_no: input.group_no,
        },
        include: {
          leetcoders: {
            where: {
              status: 'APPROVED',
            },
          },
          group_progress: true,
          submissions: {
            include: {
              problem: true,
              user: true,
            },
          },
        },
      })

      await redis.set(REDIS_KEYS.GROUP_DATA(input.group_no.toString()), groupData, { ex: 900 }) // cache for 15 minutes
      return groupData as GroupTableDataType
    }),
  /**
   * Get all groups for /dashboard page
   * revalidates every 7 days
   * @returns {groups[]}
   */
  getAllGroups: publicProcedure.query(async () => {
    const cachedGroups = (await redis.get(REDIS_KEYS.ALL_GROUPS)) as groups[] | null
    if (cachedGroups) {
      logger.debug(`[Cache] Using cached all groups data`)
      return cachedGroups
    }

    const groups = await db.groups.findMany()

    await redis.set(REDIS_KEYS.ALL_GROUPS, groups, { ex: 900 }) // cache for 15 minutes
    return groups
  }),
  /**
   * Get all available groups for /profile page
   * revalidates every 24 hours
   */
  getAllAvailableGroups: publicProcedure.query(async () => {
    const groups = await db.groups.findMany({
      include: {
        leetcoders: {
          where: {
            status: {
              in: ['APPROVED', 'PENDING'],
            },
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        group_no: 'asc',
      },
    })

    return groups.filter((group) => group.leetcoders.length < MAX_LEETCODERS)
  }),
  /**
   * Get all groups info for /groups page
   * revalidates every 24 hours
   * - on requestToJoinGroup, the cache is invalidated
   * - on each leetcoder change group request, the cache is invalidated
   * @returns {GetAllGroupsInfoType[]}
   */
  getAllGroupsInfo: publicProcedure.query(async () => {
    const cachedGroupsInfo = (await redis.get(REDIS_KEYS.ALL_GROUPS_INFO)) as GetAllGroupsInfoType[] | null
    if (cachedGroupsInfo) {
      logger.debug(`[Cache] Using cached all groups info data`)
      return cachedGroupsInfo
    }

    const groupsInfo = await db.groups.findMany({
      orderBy: {
        group_no: 'asc',
      },
      include: {
        leetcoders: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        group_progress: {
          include: {
            roadmap: {
              select: {
                topic: true,
                problem_order: true,
              },
            },
          },
        },
      },
    })

    await redis.set(REDIS_KEYS.ALL_GROUPS_INFO, groupsInfo, { ex: 900 }) // cache for 15 minutes
    return groupsInfo as GetAllGroupsInfoType[]
  }),
})
