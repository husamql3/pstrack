import "dotenv/config"
import { defineConfig } from "prisma/config"

const datasourceUrl = process.env.DATABASE_URL

export default defineConfig({
	schema: "prisma/schema.prisma",
	...(datasourceUrl ? { datasource: { url: datasourceUrl } } : {}),
})
