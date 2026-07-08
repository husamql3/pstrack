#!/usr/bin/env bun
import { spawnSync } from "node:child_process"

import { readProdEnv } from "./env-sync"

const GH_ENVIRONMENT = "production"

// GitHub rejects secret/variable names with the GITHUB_ prefix; rename on push.
const KEY_RENAMES: Record<string, string> = {
	GITHUB_CLIENT_ID: "GH_CLIENT_ID",
	GITHUB_CLIENT_SECRET: "GH_CLIENT_SECRET",
}

// These are referenced as ${{ vars.* }} in GitHub Actions.
// VITE_* values are client-exposed by design, so they belong in variables too.
const GITHUB_VARIABLE_KEYS = new Set([
	"EMAIL_FROM",
	"POLAR_SUCCESS_URL",
	"SENTRY_TRACES_SAMPLE_RATE",
])

type GithubEnvEntry = {
	name: string
	sourceKey: string
	value: string
}

function toGithubEntry([sourceKey, value]: [string, string]): GithubEnvEntry {
	return {
		name: KEY_RENAMES[sourceKey] ?? sourceKey,
		sourceKey,
		value,
	}
}

function isGithubVariable(sourceKey: string): boolean {
	return sourceKey.startsWith("VITE_") || GITHUB_VARIABLE_KEYS.has(sourceKey)
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

function setVariable(name: string, value: string): boolean {
	const r = spawnSync("gh", ["variable", "set", name, "--body", value], {
		stdio: ["ignore", "ignore", "pipe"],
	})
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

	const entries = Object.entries(readProdEnv()).map(toGithubEntry)
	const variables = entries.filter(({ sourceKey }) => isGithubVariable(sourceKey))
	const secrets = entries.filter(({ sourceKey }) => !isGithubVariable(sourceKey))

	console.log(`\nSyncing ${variables.length} variables → GitHub repository\n`)

	let syncedVariables = 0
	let failedVariables = 0

	for (const { name, value } of variables) {
		if (setVariable(name, value)) {
			console.log(`  ~ synced   ${name}`)
			syncedVariables++
		} else {
			failedVariables++
		}
	}

	console.log(`\nSyncing ${secrets.length} secrets → GitHub env "${GH_ENVIRONMENT}"\n`)

	let syncedSecrets = 0
	let failedSecrets = 0

	for (const { name, value } of secrets) {
		if (setSecret(name, value)) {
			console.log(`  ~ synced   ${name}`)
			syncedSecrets++
		} else {
			failedSecrets++
		}
	}

	const failed = failedVariables + failedSecrets
	console.log(
		`\nDone - ${syncedVariables} variables synced, ${syncedSecrets} secrets synced, ${failed} failed\n`
	)
	if (failed > 0) process.exit(1)
}

main()
