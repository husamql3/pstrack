import { z } from 'zod/v4'
import { TRPCError } from '@trpc/server'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'
import { sendAcceptanceEmail } from '@/utils/email/sendAcceptanceEmail'
import { AUTHOR_EMAIL } from '@/data/constants'

export const emailRouter = createTRPCRouter({
  acceptanceEmail: publicProcedure
    .input(
      z.object({
        group_no: z.number(),
        email: z.string().email(),
        username: z.string().min(2).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only allow access if the user is the admin
      if (ctx.user && ctx.user.email !== AUTHOR_EMAIL) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Only admin can access this resource',
        })
      }

      await sendAcceptanceEmail({
        group_no: input.group_no,
        email: input.email,
        username: input.username,
      })
    }),
  sendEmail: publicProcedure
    .input(
      z.object({
        context: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ input }) => {
      await sendAdminNotification(input.context)
    }),
})
