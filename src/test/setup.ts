/**
 * Per-suite reset wiring for integration tests.
 *
 * This file is only referenced by the "integration" vitest project (see
 * vitest.config.ts). Unit tests use a separate project with no setupFiles, so
 * they never touch this module and never need a real DB connection.
 */

import { beforeEach } from "vitest"

import { resetDb } from "./db"

beforeEach(async () => {
	await resetDb()
})
