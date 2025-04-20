import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import { redis } from '@/config/redis'
import { env } from '@/config/env.mjs'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { sendAdminNotification } from '@/utils/email/sendEmail'

export const cacheRouter = createTRPCRouter({
  invalidateGroupData: publicProcedure
    .input(
      z.object({
        groupId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { groupId } = input

      try {
        await redis.del(`group:${groupId}:data`)
      } catch (error) {
        await sendAdminNotification({
          operation: 'cache-invalidation',
          errorMessage: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to invalidate group data',
        })
      }
    }),
})
