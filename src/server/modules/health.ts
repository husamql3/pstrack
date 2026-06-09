import { Elysia, status } from "elysia"

import { db } from "@/server/lib/db"

async function healthHandler() {
	try {
		await Promise.race([
			db.$queryRaw`SELECT 1`,
			new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 3000)),
		])
		return { status: "ok", db: "ok" }
	} catch (err) {
		return status(503, {
			status: "degraded",
			db: "error",
			error: err instanceof Error ? err.message : "unknown",
		})
	}
}

export const health = new Elysia({ tags: ["Health"] }).get("/health", healthHandler)
