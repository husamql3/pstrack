import type { PoolConfig } from "@neondatabase/serverless"
import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaPg } from "@prisma/adapter-pg"
import ws from "ws"

import { env } from "@/env"
import { PrismaClient } from "@/generated/prisma/client"

neonConfig.webSocketConstructor = globalThis.WebSocket ?? ws

const globalForPrisma = globalThis as {
	prisma?: PrismaClient
}

function createPrismaClient() {
	const adapter = isNeonUrl(env.DATABASE_URL)
		? new PrismaNeon({ connectionString: env.DATABASE_URL } satisfies PoolConfig)
		: new PrismaPg(env.DATABASE_URL)

	return new PrismaClient({ adapter })
}

function isNeonUrl(connectionString: string) {
	try {
		return new URL(connectionString).hostname.endsWith(".neon.tech")
	} catch {
		return false
	}
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== "production") {
	globalForPrisma.prisma = db
}
