import { describe, expect, it, vi } from "vitest"

// Importing "@/env" builds the singleton `env` at module load, which validates
// the ambient process.env. Set the escape hatch first and load the module
// dynamically so this suite is import-safe on a machine without a .env — the
// same way CI runs (SKIP_ENV_VALIDATION=1). The functions under test take
// explicit inputs, so this ambient skip never leaks into the assertions below.
process.env.SKIP_ENV_VALIDATION = "1"
const { buildEnv, resolveSkipValidation } = await import("@/env")

// Obviously-fake values — never real credentials. Covers every required server
// var so validation only fails on the field a given test intentionally omits.
const validServerEnv = {
	NODE_ENV: "production",
	DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
	DIRECT_URL: "postgresql://user:pass@localhost:5432/db",
	BETTER_AUTH_SECRET: "x".repeat(32),
	BETTER_AUTH_API_KEY: "test-api-key",
	GOOGLE_CLIENT_ID: "test-google-id",
	GOOGLE_CLIENT_SECRET: "test-google-secret",
	GITHUB_CLIENT_ID: "test-github-id",
	GITHUB_CLIENT_SECRET: "test-github-secret",
	RESEND_API_KEY: "test-resend-key",
	POLAR_ACCESS_TOKEN: "test-polar-token",
	POLAR_PRODUCT_ID: "test-product-id",
	POLAR_SUCCESS_URL: "https://pstrack.test/success",
}

describe("resolveSkipValidation", () => {
	it("never skips validation in a production server, even if SKIP_ENV_VALIDATION is set", () => {
		// This is the core of #281: a production server must fail fast on missing
		// required config, so the escape hatch is ignored there.
		expect(
			resolveSkipValidation({ isServer: true, nodeEnv: "production", skipFlag: "1" })
		).toBe(false)
		expect(
			resolveSkipValidation({
				isServer: true,
				nodeEnv: "production",
				skipFlag: undefined,
			})
		).toBe(false)
	})

	it("honors the escape hatch off the production server (build, tests, dev)", () => {
		expect(
			resolveSkipValidation({ isServer: true, nodeEnv: "test", skipFlag: "1" })
		).toBe(true)
		expect(
			resolveSkipValidation({ isServer: true, nodeEnv: "development", skipFlag: "1" })
		).toBe(true)
		// Client bundle (isServer=false) may skip regardless of node env.
		expect(
			resolveSkipValidation({ isServer: false, nodeEnv: "production", skipFlag: "1" })
		).toBe(true)
	})

	it("validates by default when the escape hatch is unset", () => {
		expect(
			resolveSkipValidation({
				isServer: true,
				nodeEnv: "development",
				skipFlag: undefined,
			})
		).toBe(false)
		expect(
			resolveSkipValidation({
				isServer: false,
				nodeEnv: "production",
				skipFlag: undefined,
			})
		).toBe(false)
	})
})

describe("buildEnv fail-fast", () => {
	it("throws when a required server var is missing and validation is not skipped", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {})
		expect(() =>
			buildEnv({
				isServer: true,
				skipValidation: false,
				runtimeEnv: { ...validServerEnv, POLAR_PRODUCT_ID: undefined },
			})
		).toThrow()
		spy.mockRestore()
	})

	it("boots when every required server var is present", () => {
		const env = buildEnv({
			isServer: true,
			skipValidation: false,
			runtimeEnv: validServerEnv,
		})
		expect(env.POLAR_PRODUCT_ID).toBe("test-product-id")
		expect(env.POLAR_SUCCESS_URL).toBe("https://pstrack.test/success")
	})

	it("tolerates a missing required var only when validation is skipped", () => {
		expect(() =>
			buildEnv({
				isServer: true,
				skipValidation: true,
				runtimeEnv: { ...validServerEnv, POLAR_PRODUCT_ID: undefined },
			})
		).not.toThrow()
	})

	it("does not surface provided secret values in the validation failure output", () => {
		const secret = "polar_secret_value_that_must_not_leak"
		const logged: string[] = []
		const spy = vi.spyOn(console, "error").mockImplementation((...args) => {
			logged.push(
				args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")
			)
		})
		expect(() =>
			buildEnv({
				isServer: true,
				skipValidation: false,
				// A valid secret is supplied; a *different* required var is omitted so
				// validation fails. The failure output must reference field names only.
				runtimeEnv: {
					...validServerEnv,
					POLAR_ACCESS_TOKEN: secret,
					POLAR_PRODUCT_ID: undefined,
				},
			})
		).toThrow()
		spy.mockRestore()
		expect(logged.join("\n")).not.toContain(secret)
	})
})
