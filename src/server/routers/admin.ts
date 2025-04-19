import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { sendAdminNotification } from '@/utils/email/sendEmail'

export const adminRouter = createTRPCRouter({
  sendEmail: publicProcedure
    .input(
      z.object({
        context: z.record(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      await sendAdminNotification(input.context)
    }),
})
