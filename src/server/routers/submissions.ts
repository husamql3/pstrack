import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { db } from '@/prisma/db'

export const submissionsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        problemId: z.string().uuid(),
        group_no: z.string().transform((val) => Number(val)),
      })
    )
    .mutation(async ({ input }) => {
      return db.submissions.create({
        data: {
          user_id: input.userId,
          problem_id: input.problemId,
          solved: true,
          group_no: input.group_no,
        },
      })
    }),
})
