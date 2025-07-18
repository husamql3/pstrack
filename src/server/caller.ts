import { headers } from 'next/headers'
import { getLeetcoderById } from '@/dao/leetcoder.dao'
import { db } from '@/prisma/db'
import { appRouter } from '@/server/root'
import { createCallerFactory } from '@/server/trpc'
import { createClient } from '@/supabase/server'

// Create a type-safe caller that can be used in server components
export const createCaller = async () => {
  const headersList = await headers()
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // intead of query the leetcoder in each componet bind it with the user session
  let leetcoder = null
  if (session?.user?.id) {
    leetcoder = await getLeetcoderById(session.user.id)
  }

  return createCallerFactory(appRouter)({
    headers: new Headers(headersList),
    db,
    user: session?.user ? { ...session.user, leetcoder } : null,
  })
}
