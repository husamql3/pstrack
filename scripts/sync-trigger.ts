#!/usr/bin/env bun
import { readProdEnv } from "./env-sync"

const TRIGGER_API = process.env.TRIGGER_API_URL ?? "https://api.trigger.dev"
const PROJECT_REF = "proj_nhquzeoumjpzigemrkxj"
const SLUG = "prod"

// Meta-credentials and client-only vars don't belong in Trigger.dev
const SKIP_KEYS = new Set([
	"VERCEL_TOKEN",
	"VERCEL_ORG_ID",
	"VERCEL_PROJECT_ID",
	"TRIGGER_ACCESS_TOKEN",
	"TRIGGER_API_URL",
])

async function main() {
	const vars = readProdEnv()

	const token = vars.TRIGGER_ACCESS_TOKEN ?? process.env.TRIGGER_ACCESS_TOKEN
	if (!token) {
		console.error("Missing TRIGGER_ACCESS_TOKEN in .env.prod or environment")
		process.exit(1)
	}

	const variables = Object.fromEntries(
		Object.entries(vars)
			.filter(([key]) => !SKIP_KEYS.has(key))
			.filter(([key]) => !key.startsWith("VITE_"))
	)

	const keys = Object.keys(variables)
	console.log(
		`\nSyncing ${keys.length} variables → Trigger.dev ${SLUG} (${PROJECT_REF})\n`
	)

	const res = await fetch(
		`${TRIGGER_API}/api/v1/projects/${PROJECT_REF}/envvars/${SLUG}/import`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ variables, override: true }),
		}
	)

	if (!res.ok) {
		console.error(`Failed: ${res.status} ${await res.text()}`)
		process.exit(1)
	}

	for (const key of keys) console.log(`  ~ synced  ${key}`)
	console.log(`\nDone - ${keys.length} variables synced\n`)
}

main()
