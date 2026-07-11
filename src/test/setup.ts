/**
 * Per-suite reset wiring for integration tests.
 *
 * This file is only referenced by the "integration" vitest project (see
 * vitest.config.ts). Unit tests use a separate project with no setupFiles, so
 * they never touch this module and never need a real DB connection.
 */

import { beforeEach } from "vitest"

const TEST_DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	"postgresql://pstrack:pstrack@127.0.0.1:5433/pstrack?schema=public"

process.env.DATABASE_URL = TEST_DATABASE_URL
process.env.DIRECT_URL = TEST_DATABASE_URL
process.env.NODE_ENV = "test"
process.env.SKIP_ENV_VALIDATION = "1"
process.env.BETTER_AUTH_URL ??= "https://pstrack.test"
process.env.EMAIL_FROM ??= "PStrack <test@pstrack.test>"

const { resetDb } = await import("./db")

beforeEach(async () => {
	await resetDb()
})
