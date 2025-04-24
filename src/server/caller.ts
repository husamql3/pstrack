import { headers } from 'next/headers'
import { createClient } from '@/supabase/server'

import { createCallerFactory } from '@/server/trpc'
import { appRouter } from '@/server/root'
import { db } from '@/prisma/db'

// Create a type-safe caller that can be used in server components
export const createCaller = async () => {
  const headersList = await headers()
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return createCallerFactory(appRouter)({
    headers: new Headers(headersList),
    db,
    user: session?.user ?? null,
  })
}
