import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { db } from '@/prisma/db'

export const roadmapRouter = createTRPCRouter({
  getGroupProblems: publicProcedure
    .input(
      z.array(
        z.object({
          current_problem: z.number(),
        })
      )
    )
    .query(async ({ input }) => {
      if (!input.length) return []
      const currentProblems = input.map((gp) => gp.current_problem)
      return await db.roadmap.findMany({
        where: {
          problem_order: {
            in: currentProblems,
          },
        },
      })
    }),
})
