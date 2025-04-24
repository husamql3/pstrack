import { TRPCError } from '@trpc/server'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { createClient } from '@/supabase/server'

export const authRouter = createTRPCRouter({
  getUser: publicProcedure.query(async () => {
    const supabase = await createClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) return null
    return session?.user ?? null
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
