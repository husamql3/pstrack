import { PrismaClient } from '@prisma/client'
import { withOptimize } from '@prisma/extension-optimize'

import { env } from '@/config/env.mjs'

const createPrismaClient = () =>
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends(withOptimize({ apiKey: env.OPTIMIZE_API_KEY }))

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = db
