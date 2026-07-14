#!/usr/bin/env bun
import { readProdEnv } from "./env-sync"

const DEFAULT_APP_UUID = "j5a3mtprehh83vq13vcy6ldp"

const SKIP_KEYS = new Set([
	"COOLIFY_API_TOKEN",
	"COOLIFY_API_URL",
	"COOLIFY_APP_UUID",
	"TRIGGER_ACCESS_TOKEN",
	"TRIGGER_API_URL",
])

type CoolifyEnv = {
	key: string
}

async function coolifyFetch(path: string, init: RequestInit = {}) {
	const vars = readProdEnv()
	const apiUrl = vars.COOLIFY_API_URL ?? process.env.COOLIFY_API_URL
	const token = vars.COOLIFY_API_TOKEN ?? process.env.COOLIFY_API_TOKEN

	if (!apiUrl || !token) {
		console.error("Missing COOLIFY_API_URL or COOLIFY_API_TOKEN")
		process.exit(1)
	}

	const res = await fetch(`${apiUrl.replace(/\/$/, "")}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/json",
			"Content-Type": "application/json",
			...init.headers,
		},
	})

	if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
	return res
}

async function main() {
	const vars = readProdEnv()
	const appUuid =
		vars.COOLIFY_APP_UUID ?? process.env.COOLIFY_APP_UUID ?? DEFAULT_APP_UUID
	const toSync = Object.entries(vars).filter(([key]) => !SKIP_KEYS.has(key))

	const existingRes = await coolifyFetch(`/api/v1/applications/${appUuid}/envs`)
	const existing = (await existingRes.json()) as CoolifyEnv[]
	const existingKeys = new Set(existing.map((env) => env.key))

	console.log(`\nSyncing ${toSync.length} variables -> Coolify application ${appUuid}\n`)

	let created = 0
	let updated = 0
	let failed = 0

	for (const [key, value] of toSync) {
		const exists = existingKeys.has(key)
		const body = JSON.stringify({
			key,
			value,
			is_buildtime: true,
			is_runtime: true,
			is_preview: false,
		})

		try {
			if (exists) {
				await coolifyFetch(`/api/v1/applications/${appUuid}/envs`, {
					method: "PATCH",
					body,
				})
				console.log(`  ~ updated  ${key}`)
				updated++
			} else {
				await coolifyFetch(`/api/v1/applications/${appUuid}/envs`, {
					method: "POST",
					body,
				})
				console.log(`  + created  ${key}`)
				created++
			}
		} catch (err) {
			console.error(`  x failed   ${key}: ${err}`)
			failed++
		}
	}

	console.log(`\nDone - ${created} created, ${updated} updated, ${failed} failed\n`)
	if (failed > 0) process.exit(1)
}

main()
