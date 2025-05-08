import { TRPCError } from '@trpc/server'
import { User } from '@supabase/supabase-js'
import type { leetcoders } from '@prisma/client'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { createClient } from '@/supabase/server'
import { getLeetcoderById } from '@/dao/leetcoder.dao'

export type AuthLeetcoder = User & {
  leetcoder: leetcoders | null
}

export const authRouter = createTRPCRouter({
  getUser: publicProcedure.query(async (): Promise<AuthLeetcoder | null> => {
    const supabase = await createClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    // If there's an error or no session, return null
    if (error || !session?.user) return null

    // Get the associated leetcoder profile
    const leetcoder = await getLeetcoderById(session.user.id)
    
    // Always return AuthLeetcoder type with consistent structure
    // If there's no leetcoder profile, leetcoder will be null
    return {
      ...session.user,
      leetcoder,
    }
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
