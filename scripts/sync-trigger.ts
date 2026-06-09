#!/usr/bin/env bun
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const ENV_FILE = resolve(import.meta.dirname, "../.env.prod")
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

function parseEnvFile(content: string): Record<string, string> {
	const vars: Record<string, string> = {}

	for (const line of content.split("\n")) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith("#")) continue

		const eqIdx = trimmed.indexOf("=")
		if (eqIdx === -1) continue

		const key = trimmed.slice(0, eqIdx).trim()
		let value = trimmed.slice(eqIdx + 1).trim()

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1)
		}

		if (key) vars[key] = value
	}

	return vars
}

async function main() {
	const content = readFileSync(ENV_FILE, "utf-8")
	const vars = parseEnvFile(content)

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
