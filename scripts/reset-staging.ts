#!/usr/bin/env bun

import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { writeFile } from "node:fs/promises"

import { buildStagingSeedEvidence } from "./lib/staging-seed-evidence"

type StagingResetEnvironment = Record<string, string | undefined>

type StagingSeedEvidence = {
	healthy: boolean
	userCount: number
	groupCount: number
	dailyProblemCount: number
	unexpectedUserCount: number
	missingUserCount: number
	unexpectedGroupCount: number
	missingGroupCount: number
}

const APPROVED_STAGING_IDENTITIES = {
	database: "9869b04020201187d0a9d07f7a38ddd84cd0726d7daae188a5b7fe7b4636db8f",
	direct: "862cd682b6754e3d04bc6351a8bce62924a61f908687ddd3771e480b9e040090",
}

const OUTBOUND_EMAIL_KEYS = ["RESEND_API_KEY", "SMTP_HOST", "SMTP_USER", "SMTP_PASS"]

export const databaseIdentityFingerprint = (value: string | undefined) => {
	if (!value) throw new Error("DATABASE_URL and DIRECT_URL are required")
	try {
		const url = new URL(value)
		if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
			throw new Error("invalid protocol")
		}
		if (!url.hostname.toLowerCase().endsWith(".neon.tech") || url.pathname === "/") {
			throw new Error("invalid staging target")
		}
		const schemas = url.searchParams.getAll("schema")
		if (schemas.length > 1 || schemas[0]?.includes(",")) {
			throw new Error("invalid staging target")
		}
		const schema = schemas[0] ?? "public"
		return createHash("sha256")
			.update(
				`${url.hostname.toLowerCase()}:${url.port || "5432"}${url.pathname}?schema=${schema}`
			)
			.digest("hex")
	} catch {
		throw new Error("DATABASE_URL and DIRECT_URL must be valid PostgreSQL URLs")
	}
}

export const validateStagingResetConfig = (
	environment: StagingResetEnvironment,
	args: string[],
	approvedIdentities = APPROVED_STAGING_IDENTITIES
) => {
	if (environment.PSTRACK_ENVIRONMENT !== "staging") {
		throw new Error("PSTRACK_ENVIRONMENT must be staging")
	}
	if (!args.includes("--confirm-staging-reset")) {
		throw new Error("Pass --confirm-staging-reset after approval")
	}
	if (environment.EMAIL_TRANSPORT !== "log") {
		throw new Error("EMAIL_TRANSPORT must be log")
	}
	if (OUTBOUND_EMAIL_KEYS.some((key) => Boolean(environment[key]))) {
		throw new Error("Outbound email credentials must be absent")
	}

	const databaseIdentity = databaseIdentityFingerprint(environment.DATABASE_URL)
	const directIdentity = databaseIdentityFingerprint(environment.DIRECT_URL)
	if (
		databaseIdentity !== approvedIdentities.database ||
		directIdentity !== approvedIdentities.direct
	) {
		throw new Error("Database URLs do not match approved staging database identities")
	}

	return { environment: "staging", confirmed: true }
}

export const executeStagingReset = async (
	environment: StagingResetEnvironment,
	args: string[],
	{
		runCommand,
		verifySeed,
		now,
		approvedIdentities = APPROVED_STAGING_IDENTITIES,
	}: {
		runCommand: (command: string[]) => Promise<number>
		verifySeed: () => Promise<StagingSeedEvidence>
		now: () => Date
		approvedIdentities?: { database: string; direct: string }
	}
) => {
	validateStagingResetConfig(environment, args, approvedIdentities)
	const resetExitCode = await runCommand(["bun", "run", "db:reset", "--force"])
	if (resetExitCode !== 0) throw new Error("Staging database reset failed")
	const seedExitCode = await runCommand(["bun", "run", "db:seed"])
	if (seedExitCode !== 0) throw new Error("Staging database seed failed")
	const seed = await verifySeed()

	return {
		checkedAt: now().toISOString(),
		environment: "staging",
		databaseHostMatched: true,
		emailTransport: "log",
		seed,
	}
}

const runCommand = async (command: string[]) => {
	const [executable, ...args] = command
	if (!executable) return 1
	return new Promise<number>((resolve, reject) => {
		const child = spawn(executable, args, { env: process.env, stdio: "inherit" })
		child.once("error", reject)
		child.once("exit", (code) => resolve(code ?? 1))
	})
}

const verifySeed = async (): Promise<StagingSeedEvidence> => {
	const { db } = await import("@/server/lib/db")
	try {
		const [users, groups, dailyProblemCount] = await Promise.all([
			db.user.findMany({ select: { id: true, email: true } }),
			db.group.findMany({
				select: {
					id: true,
					creatorId: true,
					_count: { select: { members: true, dailyProblems: true } },
				},
			}),
			db.dailyProblem.count(),
		])
		return buildStagingSeedEvidence({
			users,
			groups: groups.map((group) => ({
				id: group.id,
				creatorId: group.creatorId,
				memberCount: group._count.members,
				dailyProblemCount: group._count.dailyProblems,
			})),
			dailyProblemCount,
		})
	} finally {
		await db.$disconnect()
	}
}

if (import.meta.main) {
	executeStagingReset(process.env, process.argv.slice(2), {
		runCommand,
		verifySeed,
		now: () => new Date(),
	})
		.then(async (evidence) => {
			await writeFile(
				"staging-reset-evidence.json",
				`${JSON.stringify(evidence, null, 2)}\n`
			)
			console.log(JSON.stringify(evidence, null, 2))
			if (!evidence.seed.healthy) throw new Error("Seed verification failed")
		})
		.catch(() => {
			console.error("Staging reset failed; inspect sanitized evidence if present")
			process.exit(1)
		})
}
