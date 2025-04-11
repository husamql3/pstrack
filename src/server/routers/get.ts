import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { db } from '@/prisma/db'

export const getRouter = createTRPCRouter({
  /* Groups */
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
})
