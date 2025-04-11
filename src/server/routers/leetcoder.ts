import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { db } from '@/prisma/db'

export const leetcodersRouter = createTRPCRouter({
  getLeetcoderById: publicProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ input }) => {
    if (!input.id) return null
    return db.leetcoders.findUnique({
      where: { id: input.id },
    })
  }),
})