import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/server/lib/db", () => ({
	db: { $queryRaw: vi.fn() },
}))

import { db } from "@/server/lib/db"
import { health } from "@/server/modules/health"

describe("GET /health", () => {
	afterEach(() => vi.clearAllMocks())

	it("returns 200 when DB responds", async () => {
		vi.mocked(db.$queryRaw).mockResolvedValue([])

		const res = await health.handle(new Request("http://localhost/health"))
		const body = await res.json()

		expect(res.status).toBe(200)
		expect(body).toEqual({ status: "ok", db: "ok" })
	})

	it("returns 503 when DB throws", async () => {
		vi.mocked(db.$queryRaw).mockRejectedValue(new Error("Connection refused"))

		const res = await health.handle(new Request("http://localhost/health"))
		const body = await res.json()

		expect(res.status).toBe(503)
		expect(body).toEqual({ status: "degraded", db: "error", error: "Connection refused" })
	})

	it("returns 503 on timeout", async () => {
		vi.useFakeTimers()
		vi.mocked(db.$queryRaw).mockImplementation(() => new Promise(() => {}))

		const responsePromise = health.handle(new Request("http://localhost/health"))
		await vi.advanceTimersByTimeAsync(3001)
		const res = await responsePromise
		const body = await res.json()

		expect(res.status).toBe(503)
		expect(body).toEqual({ status: "degraded", db: "error", error: "DB timeout" })

		vi.useRealTimers()
	})
})
