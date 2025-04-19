import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { db } from '@/prisma/db'
import { env } from '@/config/env.mjs'
import { TRPCError } from '@trpc/server'

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
    // Only allow access if the user is the admin
    if (ctx.user && ctx.user.email !== env.ADMIN_EMAIL) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Only admin can access this resource',
      })
    }
    return db.groups.findMany()
  }),
})
