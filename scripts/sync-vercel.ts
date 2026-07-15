#!/usr/bin/env bun
import { spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parse } from "dotenv"

const STAGE_ENV_FILE = resolve(import.meta.dirname, "../.env.stage")
const PROJECT_LINK_FILE = resolve(import.meta.dirname, "../.vercel/project.json")
const VERCEL_API = process.env.VERCEL_API_URL ?? "https://api.vercel.com"
const TARGET = "production"

// Vercel's production target is PStrack's staging environment. Keep this list
// explicit so retired or production-only credentials can never hitch a ride
// from a developer's local env file.
const STAGING_KEYS = [
	"BETTER_AUTH_API_KEY",
	"BETTER_AUTH_SECRET",
	"BETTER_AUTH_URL",
	"DATABASE_URL",
	"DIRECT_URL",
	"EMAIL_FROM",
	"EMAIL_TRANSPORT",
	"GITHUB_CLIENT_ID",
	"GITHUB_CLIENT_SECRET",
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"JOB_DISPATCH_SECRET",
	"POLAR_ACCESS_TOKEN",
	"POLAR_PRODUCT_ID",
	"POLAR_SERVER",
	"POLAR_SUCCESS_URL",
	"POLAR_WEBHOOK_SECRET",
	"PSTRACK_ENVIRONMENT",
	"SENTRY_DSN",
	"SENTRY_ENVIRONMENT",
	"SENTRY_TRACES_SAMPLE_RATE",
	// REDIS_URL is deliberately absent: staging runs on Vercel's Node runtime,
	// which cannot run Bun's native Redis client, and no feature requires Redis
	// there. Redis behavior is verified by CI's harness and a production canary
	// (#288, ADR 0011).
	"VITE_BASE_URL",
	"VITE_SENTRY_DSN",
	"VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE",
	"VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE",
	"VITE_SENTRY_TRACES_SAMPLE_RATE",
]

// Not app config — never pushed to Vercel.
const SKIP_KEYS = new Set([
	"VERCEL_TOKEN",
	// Vercel force-sets NODE_ENV=production in serverless functions; pushing it
	// is rejected as a reserved key and would be ignored anyway.
	"NODE_ENV",
])

type ProjectLink = { projectId: string; orgId: string }

function readStageEnv(): Record<string, string> {
	return parse(readFileSync(STAGE_ENV_FILE, "utf-8"))
}

function readProjectLink(): ProjectLink {
	const raw = JSON.parse(readFileSync(PROJECT_LINK_FILE, "utf-8"))
	if (!raw.projectId || !raw.orgId) {
		console.error(
			"Missing projectId/orgId in .vercel/project.json — run `vercel link` first"
		)
		process.exit(1)
	}
	return { projectId: raw.projectId, orgId: raw.orgId }
}

const isUnfilled = (value: string) => !value || value.startsWith("<")

async function main() {
	const vars = readStageEnv()
	const dryRun = process.argv.includes("--dry-run")

	if (vars.EMAIL_TRANSPORT !== "log") {
		throw new Error('Staging requires EMAIL_TRANSPORT="log"')
	}
	if (vars.PSTRACK_ENVIRONMENT !== "staging") {
		throw new Error('Staging requires PSTRACK_ENVIRONMENT="staging"')
	}
	if (vars.POLAR_SERVER !== "sandbox") {
		throw new Error('Staging requires POLAR_SERVER="sandbox"')
	}

	const token = vars.VERCEL_TOKEN ?? process.env.VERCEL_TOKEN
	const { projectId, orgId } = readProjectLink()
	const query = new URLSearchParams({ upsert: "true", teamId: orgId })
	const url = `${VERCEL_API}/v10/projects/${projectId}/env?${query}`

	const entries = STAGING_KEYS.map(
		(key) => [key, vars[key] ?? ""] satisfies [string, string]
	)
	const toSync = entries.filter(([, value]) => !isUnfilled(value))
	const skipped = entries.filter(([, value]) => isUnfilled(value))
	const excluded = Object.keys(vars).filter(
		(key) => !STAGING_KEYS.includes(key) && !SKIP_KEYS.has(key)
	)

	console.log(
		`\n${dryRun ? "Would sync" : "Syncing"} ${toSync.length} allowlisted variables → Vercel project ${projectId} (${TARGET})\n`
	)

	let synced = 0
	let failed = 0

	if (dryRun) {
		for (const [key] of toSync) {
			console.log(`  ~ allowed  ${key}`)
		}
	} else {
		let nextIndex = 0
		const syncNext = async (): Promise<void> => {
			const entry = toSync[nextIndex]
			nextIndex++
			if (!entry) return
			const [key, value] = entry
			const ok =
				token && !isUnfilled(token)
					? await fetch(url, {
							method: "POST",
							headers: {
								Authorization: `Bearer ${token}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify({ key, value, type: "encrypted", target: [TARGET] }),
						}).then(async (res) => {
							if (!res.ok)
								console.error(`  x failed   ${key}: ${res.status} ${await res.text()}`)
							return res.ok
						})
					: await new Promise<boolean>((done) => {
							const child = spawn(
								"vercel",
								["env", "add", key, TARGET, "--force", "--sensitive", "--yes"],
								{ stdio: ["pipe", "ignore", "ignore"] }
							)
							child.once("close", (code) => done(code === 0))
							child.stdin.end(value)
						})

			if (ok) {
				console.log(`  ~ synced   ${key}`)
				synced++
			} else {
				console.error(`  x failed   ${key}`)
				failed++
			}
			await syncNext()
		}
		await Promise.all(Array.from({ length: Math.min(4, toSync.length) }, syncNext))
	}

	for (const [key] of skipped) {
		console.log(`  - skipped  ${key} (unfilled placeholder)`)
	}
	for (const key of excluded) {
		console.log(`  - excluded ${key} (not in staging allowlist)`)
	}

	console.log(
		`\nDone - ${dryRun ? toSync.length : synced} ${dryRun ? "allowed" : "synced"}, ${failed} failed, ${skipped.length} skipped, ${excluded.length} excluded\n`
	)
	if (failed > 0) process.exit(1)
}

main()
