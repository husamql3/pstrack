import { Elysia, status } from "elysia"

import { db } from "@/server/lib/db"

const revision = {
	gitSha: process.env.PSTRACK_GIT_SHA ?? null,
	imageDigest: process.env.PSTRACK_IMAGE_DIGEST ?? null,
	imageRef: process.env.PSTRACK_IMAGE_REF ?? null,
	deployedAt: process.env.PSTRACK_DEPLOYED_AT ?? null,
}

async function healthHandler() {
	try {
		await Promise.race([
			db.$queryRaw`SELECT 1`,
			new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 3000)),
		])
		return { status: "ok", db: "ok", revision }
	} catch (err) {
		return status(503, {
			status: "degraded",
			db: "error",
			error: err instanceof Error ? err.message : "unknown",
			revision,
		})
	}
}

export const health = new Elysia({ tags: ["Health"] }).get("/health", healthHandler)
