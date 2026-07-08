#!/usr/bin/env bun
import { readProdEnv } from "./env-sync"

// These are Vercel meta-credentials, not app env vars
const SKIP_KEYS = new Set(["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"])

async function main() {
	const vars = readProdEnv()

	const token = vars.VERCEL_TOKEN
	const teamId = vars.VERCEL_ORG_ID
	const projectId = vars.VERCEL_PROJECT_ID

	if (!token || !projectId) {
		console.error("Missing VERCEL_TOKEN or VERCEL_PROJECT_ID in .env.prod")
		process.exit(1)
	}

	const headers = {
		Authorization: `Bearer ${token}`,
		"Content-Type": "application/json",
	}

	const baseUrl = `https://api.vercel.com/v10/projects/${projectId}/env${teamId ? `?teamId=${teamId}` : ""}`

	// Fetch existing env vars so we can upsert instead of blindly creating
	const existingRes = await fetch(baseUrl, { headers })
	if (!existingRes.ok) {
		console.error("Failed to fetch existing env vars:", await existingRes.text())
		process.exit(1)
	}

	const { envs = [] } = (await existingRes.json()) as {
		envs: { id: string; key: string; target: string[] }[]
	}

	// Map key → id for production-targeted vars
	const existingMap = new Map(
		envs.filter((e) => e.target?.includes("production")).map((e) => [e.key, e.id])
	)

	const toSync = Object.entries(vars).filter(([key]) => !SKIP_KEYS.has(key))

	console.log(`\nSyncing ${toSync.length} variables → Vercel production (${projectId})\n`)

	let created = 0
	let updated = 0
	let failed = 0

	for (const [key, value] of toSync) {
		const existingId = existingMap.get(key)

		try {
			if (existingId) {
				const patchUrl = `https://api.vercel.com/v10/projects/${projectId}/env/${existingId}${teamId ? `?teamId=${teamId}` : ""}`
				const res = await fetch(patchUrl, {
					method: "PATCH",
					headers,
					body: JSON.stringify({ value, type: "encrypted", target: ["production"] }),
				})
				if (!res.ok) throw new Error(await res.text())
				console.log(`  ~ updated  ${key}`)
				updated++
			} else {
				const res = await fetch(baseUrl, {
					method: "POST",
					headers,
					body: JSON.stringify({ key, value, type: "encrypted", target: ["production"] }),
				})
				if (!res.ok) throw new Error(await res.text())
				console.log(`  + created  ${key}`)
				created++
			}
		} catch (err) {
			console.error(`  ✗ failed   ${key}: ${err}`)
			failed++
		}
	}

	console.log(`\nDone - ${created} created, ${updated} updated, ${failed} failed\n`)
	if (failed > 0) process.exit(1)
}

main()
