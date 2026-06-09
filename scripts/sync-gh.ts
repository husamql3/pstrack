#!/usr/bin/env bun
import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const ENV_FILE = resolve(import.meta.dirname, "../.env.prod")
const GH_ENVIRONMENT = "production"

// Local-only and meta-credentials don't belong in GitHub secrets
const SKIP_KEYS = new Set(["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"])

// GitHub rejects secret names with the GITHUB_ prefix; rename on push
const KEY_RENAMES: Record<string, string> = {
	GITHUB_CLIENT_ID: "GH_CLIENT_ID",
	GITHUB_CLIENT_SECRET: "GH_CLIENT_SECRET",
}

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

function ghAvailable(): boolean {
	const r = spawnSync("gh", ["--version"], { stdio: "ignore" })
	return r.status === 0
}

function setSecret(name: string, value: string): boolean {
	const r = spawnSync(
		"gh",
		["secret", "set", name, "--env", GH_ENVIRONMENT, "--body", value],
		{ stdio: ["ignore", "ignore", "pipe"] }
	)
	if (r.status !== 0) {
		console.error(`  ✗ failed   ${name}: ${r.stderr.toString().trim()}`)
		return false
	}
	return true
}

async function main() {
	if (!ghAvailable()) {
		console.error("gh CLI not found. Install: https://cli.github.com/")
		process.exit(1)
	}

	const content = readFileSync(ENV_FILE, "utf-8")
	const vars = parseEnvFile(content)

	const toSync = Object.entries(vars)
		.filter(([key]) => !SKIP_KEYS.has(key))
		.filter(([key]) => !key.startsWith("VITE_"))
		.map(([key, value]) => [KEY_RENAMES[key] ?? key, value] as const)

	console.log(`\nSyncing ${toSync.length} secrets → GitHub env "${GH_ENVIRONMENT}"\n`)

	let synced = 0
	let failed = 0

	for (const [name, value] of toSync) {
		if (setSecret(name, value)) {
			console.log(`  ~ synced   ${name}`)
			synced++
		} else {
			failed++
		}
	}

	console.log(`\nDone - ${synced} synced, ${failed} failed\n`)
	if (failed > 0) process.exit(1)
}

main()
