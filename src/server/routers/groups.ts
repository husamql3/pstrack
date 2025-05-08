import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { db } from '@/prisma/db'
import { TRPCError } from '@trpc/server'
import { ADMINS_EMAILS } from '@/data/constants'

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
  getAllGroups: publicProcedure.query(async ({ ctx }) => {
    return db.groups.findMany()
  }),
  getAllGroupsInfo: publicProcedure.query(() => {
    return db.groups.findMany({
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
  }),
  getGroupLeetcodersCount: publicProcedure.query(async () => {
    try {
      const count = await db.leetcoders.count({
        where: {
          status: {
            in: ['APPROVED', 'PENDING'],
          },
        },
      })

      return count
    } catch (error) {
      console.error('Error fetching approved leetcoders count:', error)
      throw new Error('Failed to fetch approved leetcoders count')
    }
  }),
})
