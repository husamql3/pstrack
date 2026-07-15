import { readdir } from "node:fs/promises"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/server/lib/auth", () => ({
	auth: {
		api: { getSession: vi.fn() },
		handler: vi.fn(() => new Response("auth")),
	},
}))

vi.mock("@/server/lib/sentry", () => ({
	captureServerException: vi.fn(),
	captureServerMessage: vi.fn(),
	initServerSentry: vi.fn(),
	ServerSentry: { flush: vi.fn() },
}))

import { app } from "@/server/app"
import { STRESS_BACKGROUND_MODULES, STRESS_ENDPOINTS } from "@/test/stress-manifest"

describe("stress manifest", () => {
	it("classifies every registered API endpoint", () => {
		const actual = app.routes.map((route) => ({
			method: route.method,
			path: route.path,
		}))

		const expected = STRESS_ENDPOINTS.map(({ method, path }) => ({ method, path }))

		expect(actual).toEqual(expected)
		expect(STRESS_ENDPOINTS.every((endpoint) => endpoint.dimensions.length > 0)).toBe(
			true
		)
	})

	it("classifies every Trigger module", async () => {
		const entries = await readdir(new URL("../trigger", import.meta.url))
		const actual = entries
			.filter((entry) => entry.endsWith(".ts"))
			.filter((entry) => !entry.endsWith(".test.ts"))
			.sort()

		const expected = STRESS_BACKGROUND_MODULES.map((module) => module.file).sort()

		expect(actual).toEqual(expected)
		expect(
			STRESS_BACKGROUND_MODULES.every((module) => module.dimensions.length > 0)
		).toBe(true)
	})
})
