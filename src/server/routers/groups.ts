import { groups } from '@prisma/client'
import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { db } from '@/prisma/db'
import { MAX_LEETCODERS, REDIS_KEYS } from '@/data/constants'
import { redis } from '@/config/redis'
import type { GetAllGroupsInfoType } from '@/trpc/groups.type'

export const groupsRouter = createTRPCRouter({
  getAllGroupsNo: publicProcedure.query(() => {
    return db.groups.findMany({
      select: { group_no: true },
    })
  }),
  getGroupByNo: publicProcedure
    .input(z.object({ group_no: z.string().transform((val) => Number(val)) }))
    .query(({ input }) => {
      return db.groups.findUnique({
        where: { group_no: input.group_no },
        select: { group_no: true },
      })
    }),
  getGroupTableData: publicProcedure
    .input(z.object({ group_no: z.string().transform((val) => Number(val)) }))
    .query(({ input }) => {
      return db.groups.findUnique({
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
    }),
  /**
   * Get all groups for /dashboard page
   * revalidates every 7 days
   * @returns {groups[]}
   */
  getAllGroups: publicProcedure.query(async () => {
    const cachedGroups = (await redis.get(REDIS_KEYS.ALL_GROUPS)) as groups[] | null
    if (cachedGroups) return cachedGroups

    const groups = await db.groups.findMany()

    await redis.set(REDIS_KEYS.ALL_GROUPS, groups, { ex: 604800 }) // cache for 7 days
    return groups
  }),
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
    if (cachedGroupsInfo) return cachedGroupsInfo

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

    await redis.set(REDIS_KEYS.ALL_GROUPS_INFO, groupsInfo, { ex: 86400 }) // cache for one day
    return groupsInfo as GetAllGroupsInfoType[]
  }),
  getGroupLeetcodersCount: publicProcedure.query(async () => {
    return db.leetcoders.count({
      where: {
        status: {
          in: ['APPROVED', 'PENDING'],
        },
      },
    })
  }),
})
