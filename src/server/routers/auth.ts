import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import type { Provider } from '@supabase/supabase-js'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { createClient } from '@/supabase/server'

export const authRouter = createTRPCRouter({
  getUser: publicProcedure.query(async () => {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }

    return user ?? null
  }),

  signInWithOAuth: publicProcedure
    .input(
      z.object({
        provider: z.string() as z.ZodType<Provider>,
      })
    )
    .mutation(async ({ input }) => {
      const supabase = await createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: input.provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            returnTo: window.location.pathname,
          },
        },
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return { success: true }
    }),

  signOut: publicProcedure.mutation(async () => {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }

    return { success: true }
  }),
})
