import { describe, expect, it } from "vitest"

// Importing "@/server/lib/redis" loads "@/env" at module scope, so set the
// escape hatch before the dynamic import - the same way CI runs
// (SKIP_ENV_VALIDATION=1). Redis network behavior is covered by
// scripts/verify-redis.ts under the Bun runtime, not by this suite.
process.env.SKIP_ENV_VALIDATION = "1"
const { createRedisKey } = await import("@/server/lib/redis")

describe("createRedisKey", () => {
	it("prefixes parts with the app namespace", () => {
		expect(createRedisKey("digest", 42)).toBe("pstrack:digest:42")
	})

	it("trims whitespace and drops empty parts", () => {
		expect(createRedisKey(" a ", "", "b")).toBe("pstrack:a:b")
	})
})
