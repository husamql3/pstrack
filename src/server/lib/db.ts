import type { PoolConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"

import { env } from "@/env"
import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
	prisma?: PrismaClient
}

function createPrismaClient() {
	const neonConfig: PoolConfig = { connectionString: env.DATABASE_URL }
	const adapter = new PrismaNeon(neonConfig)

	return new PrismaClient({ adapter, log: ["error"] })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== "production") {
	globalForPrisma.prisma = db
}
