import "dotenv/config"
import { defineConfig } from "prisma/config"

// Use DIRECT_URL for migrations (bypasses Neon connection pooler)
// At runtime, the Neon adapter in src/server/lib/db.ts uses DATABASE_URL (pooled)
const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL

export default defineConfig({
	schema: "prisma/schema.prisma",
	...(datasourceUrl ? { datasource: { url: datasourceUrl } } : {}),
})
