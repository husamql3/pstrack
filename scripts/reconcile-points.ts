#!/usr/bin/env bun
import { execFile, spawn } from "node:child_process"
import { randomUUID } from "node:crypto"
import { promisify } from "node:util"
import { treaty } from "@elysiajs/eden"

import type { App } from "@/server/app"
import { buildPointRepairSql } from "@/server/points/points.repair-sql"
import type { PointReconciliationResult } from "@/server/points/points.type"
import { readProdEnv } from "./env-sync"

type BackupProof = {
	createdAt: string
	sha256: string
}

const apply = process.argv.includes("--apply")
const prepare = process.argv.includes("--prepare")
const execFileAsync = promisify(execFile)
const argumentValue = (name: string) =>
	process.argv
		.find((argument) => argument.startsWith(`--${name}=`))
		?.slice(name.length + 3)
const expectedValue = argumentValue("expected")
const expectedMismatches = expectedValue === undefined ? null : Number(expectedValue)
const restoreProof = argumentValue("restore-proof") ?? null

if (apply && prepare) throw new Error("Choose either --prepare or --apply")
if (
	(apply || prepare) &&
	(!Number.isInteger(expectedMismatches) || expectedMismatches === null)
) {
	throw new Error("Preparation and repair require --expected=<mismatch-count>")
}
if (apply && (!restoreProof || !/^[a-f0-9]{64}$/.test(restoreProof))) {
	throw new Error("Repair requires --restore-proof=<restored-backup-sha256>")
}

const env = readProdEnv()
const baseUrl = env.JOB_DISPATCH_URL?.replace(/\/$/, "")
const secret = env.JOB_DISPATCH_SECRET
if (!baseUrl || !secret) {
	throw new Error("JOB_DISPATCH_URL and JOB_DISPATCH_SECRET are required in .env.prod")
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value)

const parseResult = (value: unknown): PointReconciliationResult => {
	if (!isRecord(value) || !isRecord(value.result)) {
		throw new Error("Reconciliation endpoint returned an invalid response")
	}
	const result = value.result
	const keys = [
		"checkedUsers",
		"mismatchedUsers",
		"absoluteDrift",
		"correctedUsers",
		"proGranted",
	]
	if (!keys.every((key) => typeof result[key] === "number")) {
		throw new Error("Reconciliation endpoint omitted aggregate evidence")
	}
	return {
		checkedUsers: Number(result.checkedUsers),
		mismatchedUsers: Number(result.mismatchedUsers),
		absoluteDrift: Number(result.absoluteDrift),
		correctedUsers: Number(result.correctedUsers),
		proGranted: Number(result.proGranted),
	}
}

const api = treaty<App>(baseUrl, {
	headers: { authorization: `Bearer ${secret}` },
}).api

const runAudit = async (label: string) => {
	const scheduledAt = new Date().toISOString()
	const { data, error } = await api.v3.internal
		.jobs({ jobName: "reconcile-points" })
		.post({
			idempotencyKey: `reconcile-points:${label}:${scheduledAt}`,
			scheduledAt,
		})
	if (error) throw new Error(`Reconciliation request failed (${error.status})`)
	return parseResult(data)
}

const runSsh = async (command: string) => {
	const { stdout } = await execFileAsync("ssh", ["pstrack", command], {
		maxBuffer: 10 * 1024 * 1024,
	})
	return stdout
}

const latestVerifiedBackup = async (): Promise<BackupProof> => {
	const python = [
		"import glob,hashlib,json,os",
		"p=sorted(glob.glob('/var/lib/pstrack-backups/repo/backups/**/manifest.json', recursive=True))[-1]",
		"d=json.load(open(p))",
		"f=os.path.join('/var/lib/pstrack-backups/repo', d['dumpFile'])",
		"actual=hashlib.sha256(open(f,'rb').read()).hexdigest()",
		"assert actual == d['sha256']",
		"print(json.dumps({'createdAt':d['createdAt'],'sha256':d['sha256']}))",
	].join(";")
	const output = await runSsh(
		`docker exec pstrack-db-backups python3 -c ${JSON.stringify(python)}`
	)
	const parsed: unknown = JSON.parse(output)
	if (
		!isRecord(parsed) ||
		typeof parsed.createdAt !== "string" ||
		typeof parsed.sha256 !== "string" ||
		!/^[a-f0-9]{64}$/.test(parsed.sha256)
	) {
		throw new Error("Backup verification did not produce valid aggregate proof")
	}
	return { createdAt: parsed.createdAt, sha256: parsed.sha256 }
}

const prepareBackup = async () => {
	await runSsh("docker exec pstrack-db-backups /app/scripts/backup.sh")
	return latestVerifiedBackup()
}

const runProductionSql = async (sql: string) => {
	const command = [
		"db=$(docker ps --filter ancestor=postgres:18-alpine --format '{{.Names}}' | head -1)",
		'test -n "$db"',
		'docker exec -i "$db" sh -lc \'psql -v ON_ERROR_STOP=1 -X -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"\'',
	].join("; ")
	const child = spawn("ssh", ["pstrack", command], { stdio: ["pipe", "pipe", "pipe"] })
	let stdout = ""
	let stderr = ""
	child.stdout.setEncoding("utf8").on("data", (chunk) => {
		stdout += chunk
	})
	child.stderr.setEncoding("utf8").on("data", (chunk) => {
		stderr += chunk
	})
	child.stdin.end(sql)
	const exitCode = await new Promise<number>((resolve, reject) => {
		child.once("error", reject)
		child.once("close", (code) => resolve(code ?? 1))
	})
	if (exitCode !== 0) throw new Error(`Production repair failed: ${stderr.trim()}`)
	const lastLine = stdout.trim().split("\n").at(-1)
	if (!lastLine) throw new Error("Production repair returned no aggregate evidence")
	const parsed: unknown = JSON.parse(lastLine)
	if (!isRecord(parsed)) throw new Error("Production repair returned invalid evidence")
	return parsed
}

const dryRun = await runAudit("operator")
console.log(JSON.stringify({ mode: "dry-run", ...dryRun }))
if (!apply && !prepare) process.exit(0)
if (dryRun.mismatchedUsers !== expectedMismatches) {
	throw new Error(
		`Refusing operation: expected ${expectedMismatches} mismatches but found ${dryRun.mismatchedUsers}`
	)
}

if (prepare) {
	const backup = await prepareBackup()
	console.log(JSON.stringify({ mode: "backup-prepared", ...backup }))
	process.exit(0)
}

const backup = await latestVerifiedBackup()
if (backup.sha256 !== restoreProof) {
	throw new Error("Restore proof does not match the latest checksum-verified backup")
}
const backupAge = Date.now() - new Date(backup.createdAt).getTime()
if (!Number.isFinite(backupAge) || backupAge < 0 || backupAge > 2 * 60 * 60 * 1000) {
	throw new Error("The restored backup must be less than two hours old")
}

const repaired = await runProductionSql(
	buildPointRepairSql({
		expectedMismatches,
		backupSha256: backup.sha256,
		runId: randomUUID(),
	})
)
console.log(
	JSON.stringify({ mode: "apply", backupCreatedAt: backup.createdAt, ...repaired })
)
const verified = await runAudit("verify")
console.log(JSON.stringify({ mode: "verify", ...verified }))
if (verified.mismatchedUsers !== 0 || verified.absoluteDrift !== 0) {
	throw new Error("Post-repair invariant is not zero")
}
