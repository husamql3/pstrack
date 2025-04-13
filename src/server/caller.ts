import { createCallerFactory } from '@/server/trpc'
import { appRouter } from '@/server/root'
import { headers } from 'next/headers'
import { db } from '@/prisma/db'

// Create a type-safe caller that can be used in server components
export const createCaller = async () => {
  const headersList = await headers()
  return createCallerFactory(appRouter)({
    headers: new Headers(headersList),
    db,
  })
}
