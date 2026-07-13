import { Elysia, status } from "elysia"

import { db } from "@/server/lib/db"

const revision = {
	gitSha: process.env.PSTRACK_GIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null,
	imageDigest: process.env.PSTRACK_IMAGE_DIGEST ?? null,
	imageRef: process.env.PSTRACK_IMAGE_REF ?? null,
	deployedAt: process.env.PSTRACK_DEPLOYED_AT ?? null,
}

const runtime = {
	environment: process.env.PSTRACK_ENVIRONMENT ?? null,
	emailTransport: process.env.EMAIL_TRANSPORT ?? "resend",
}

async function healthHandler() {
	try {
		await Promise.race([
			db.$queryRaw`SELECT 1`,
			new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 3000)),
		])
		return { status: "ok", db: "ok", revision, runtime }
	} catch (err) {
		return status(503, {
			status: "degraded",
			db: "error",
			error: err instanceof Error ? err.message : "unknown",
			revision,
			runtime,
		})
	}
}

export const health = new Elysia({ tags: ["Health"] }).get("/health", healthHandler)
