import { describe, expect, it } from "vitest"

import {
	buildStagingSeedEvidence,
	SEED_GROUPS,
	SEED_USERNAMES,
} from "../../scripts/lib/staging-seed-evidence"
import {
	databaseIdentityFingerprint,
	executeStagingReset,
	validateStagingResetConfig,
} from "../../scripts/reset-staging"

const canonicalUsers = () =>
	SEED_USERNAMES.map((username) => ({
		id: `seed-user-${username}`,
		email: `seed.${username}@dev.test`,
	}))

describe("staging reset preflight", () => {
	const stagingEnvironment = {
		PSTRACK_ENVIRONMENT: "staging",
		EMAIL_TRANSPORT: "log",
		DATABASE_URL: "postgresql://user:secret@stage-pooler.example.neon.tech/app",
		DIRECT_URL: "postgresql://user:secret@stage-direct.example.neon.tech/app",
	}
	const approvedIdentities = {
		database: databaseIdentityFingerprint(stagingEnvironment.DATABASE_URL),
		direct: databaseIdentityFingerprint(stagingEnvironment.DIRECT_URL),
	}

	it("rejects a production environment before reset execution", () => {
		expect(() =>
			validateStagingResetConfig(
				{ ...stagingEnvironment, PSTRACK_ENVIRONMENT: "production" },
				["--confirm-staging-reset"],
				approvedIdentities
			)
		).toThrow("PSTRACK_ENVIRONMENT must be staging")
	})

	it("requires explicit destructive-operation confirmation", () => {
		expect(() =>
			validateStagingResetConfig(stagingEnvironment, [], approvedIdentities)
		).toThrow("Pass --confirm-staging-reset")
	})

	it.each([
		[
			"non-log email",
			{ ...stagingEnvironment, EMAIL_TRANSPORT: "resend" },
			"EMAIL_TRANSPORT must be log",
		],
		[
			"outbound email credentials",
			{ ...stagingEnvironment, RESEND_API_KEY: "configured" },
			"Outbound email credentials must be absent",
		],
		[
			"different host",
			{
				...stagingEnvironment,
				DATABASE_URL: "postgresql://user:secret@other.example.neon.tech/app",
			},
			"Database URLs do not match approved staging database identities",
		],
		[
			"same host but different database",
			{
				...stagingEnvironment,
				DATABASE_URL: "postgresql://user:secret@stage-pooler.example.neon.tech/other",
			},
			"Database URLs do not match approved staging database identities",
		],
		[
			"same database but different schema",
			{
				...stagingEnvironment,
				DATABASE_URL: `${stagingEnvironment.DATABASE_URL}?schema=other`,
			},
			"Database URLs do not match approved staging database identities",
		],
	])("rejects %s", (_case, environment, expectedMessage) => {
		expect(() =>
			validateStagingResetConfig(
				environment,
				["--confirm-staging-reset"],
				approvedIdentities
			)
		).toThrow(expectedMessage)
	})

	it("runs reset then the master seed before verification", async () => {
		const commands: string[][] = []
		const seed = {
			healthy: true,
			userCount: 50,
			groupCount: 9,
			dailyProblemCount: 315,
			unexpectedUserCount: 0,
			missingUserCount: 0,
			unexpectedGroupCount: 0,
			missingGroupCount: 0,
		}
		const evidence = await executeStagingReset(
			stagingEnvironment,
			["--confirm-staging-reset"],
			{
				runCommand: async (command) => {
					commands.push(command)
					return 0
				},
				verifySeed: async () => seed,
				now: () => new Date("2026-07-14T18:00:00.000Z"),
				approvedIdentities,
			}
		)
		expect(commands).toEqual([
			["bun", "run", "db:reset", "--force"],
			["bun", "run", "db:seed"],
		])
		expect(evidence.seed).toEqual(seed)
	})

	it.each([
		[
			"alternate port",
			`${stagingEnvironment.DATABASE_URL.replace(".neon.tech", ".neon.tech:5433")}`,
		],
		["duplicate schema", `${stagingEnvironment.DATABASE_URL}?schema=public&schema=other`],
		["comma-delimited schema", `${stagingEnvironment.DATABASE_URL}?schema=public,other`],
	])("does not execute reset for %s", async (_case, databaseUrl) => {
		const commands: string[][] = []
		await expect(
			executeStagingReset(
				{ ...stagingEnvironment, DATABASE_URL: databaseUrl },
				["--confirm-staging-reset"],
				{
					runCommand: async (command) => {
						commands.push(command)
						return 0
					},
					verifySeed: async () => {
						throw new Error("must not verify")
					},
					now: () => new Date("2026-07-14T18:00:00.000Z"),
					approvedIdentities,
				}
			)
		).rejects.toThrow()
		expect(commands).toEqual([])
	})

	it("stops before seeding or verification when reset fails", async () => {
		const commands: string[][] = []
		let verified = false
		await expect(
			executeStagingReset(stagingEnvironment, ["--confirm-staging-reset"], {
				runCommand: async (command) => {
					commands.push(command)
					return 1
				},
				verifySeed: async () => {
					verified = true
					throw new Error("must not verify")
				},
				now: () => new Date("2026-07-14T18:00:00.000Z"),
				approvedIdentities,
			})
		).rejects.toThrow("Staging database reset failed")
		expect(commands).toEqual([["bun", "run", "db:reset", "--force"]])
		expect(verified).toBe(false)
	})
})

describe("staging seed evidence", () => {
	it("rejects a plausible replacement for a canonical account", () => {
		const users = canonicalUsers()
		users[0] = { id: "seed-user-impostor", email: "seed.impostor@dev.test" }
		const evidence = buildStagingSeedEvidence({
			users,
			groups: SEED_GROUPS,
			dailyProblemCount: 315,
		})
		expect(evidence).toMatchObject({
			healthy: false,
			unexpectedUserCount: 1,
			missingUserCount: 1,
		})
		expect(JSON.stringify(evidence)).not.toContain("impostor")
	})

	it("rejects a plausible replacement for a canonical group", () => {
		const groups = SEED_GROUPS.map((group) => ({ ...group }))
		groups[0] = { ...groups[0], creatorId: "seed-user-impostor" }
		const evidence = buildStagingSeedEvidence({
			users: canonicalUsers(),
			groups,
			dailyProblemCount: 315,
		})
		expect(evidence).toMatchObject({
			healthy: false,
			unexpectedGroupCount: 1,
			missingGroupCount: 1,
		})
		expect(JSON.stringify(evidence)).not.toContain("impostor")
	})
})
