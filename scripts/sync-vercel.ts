#!/usr/bin/env bun
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parse } from "dotenv"

const STAGE_ENV_FILE = resolve(import.meta.dirname, "../.env.stage")
const PROJECT_LINK_FILE = resolve(import.meta.dirname, "../.vercel/project.json")
const VERCEL_API = process.env.VERCEL_API_URL ?? "https://api.vercel.com"
const TARGET = "production"

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

	const token = vars.VERCEL_TOKEN ?? process.env.VERCEL_TOKEN
	if (!token || isUnfilled(token)) {
		console.error("Missing VERCEL_TOKEN in .env.stage or environment")
		process.exit(1)
	}

	const { projectId, orgId } = readProjectLink()
	const query = new URLSearchParams({ upsert: "true", teamId: orgId })
	const url = `${VERCEL_API}/v10/projects/${projectId}/env?${query}`

	const entries = Object.entries(vars).filter(([key]) => !SKIP_KEYS.has(key))
	const toSync = entries.filter(([, value]) => !isUnfilled(value))
	const skipped = entries.filter(([, value]) => isUnfilled(value))

	console.log(
		`\nSyncing ${toSync.length} variables → Vercel project ${projectId} (${TARGET})\n`
	)

	let synced = 0
	let failed = 0

	for (const [key, value] of toSync) {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ key, value, type: "encrypted", target: [TARGET] }),
		})

		if (res.ok) {
			console.log(`  ~ synced   ${key}`)
			synced++
		} else {
			console.error(`  x failed   ${key}: ${res.status} ${await res.text()}`)
			failed++
		}
	}

	for (const [key] of skipped) {
		console.log(`  - skipped  ${key} (unfilled placeholder)`)
	}

	console.log(`\nDone - ${synced} synced, ${failed} failed, ${skipped.length} skipped\n`)
	if (failed > 0) process.exit(1)
}

main()
