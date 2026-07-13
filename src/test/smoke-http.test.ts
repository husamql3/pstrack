import { describe, expect, it, vi } from "vitest"

import { fetchWhenReady } from "../../scripts/smoke-http"

describe("fetchWhenReady", () => {
	it("retries transient server errors until the deployment is ready", async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
			.mockResolvedValueOnce(new Response('{"status":"ok"}', { status: 200 }))
		const sleep = vi.fn().mockResolvedValue(undefined)

		const response = await fetchWhenReady("https://example.com/health", {
			fetcher,
			maxAttempts: 2,
			retryDelayMs: 1,
			sleep,
		})

		expect(response.status).toBe(200)
		expect(fetcher).toHaveBeenCalledTimes(2)
		expect(sleep).toHaveBeenCalledOnce()
	})

	it("fails after the readiness window expires", async () => {
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
			new Response("still unavailable", {
				status: 503,
			})
		)

		await expect(
			fetchWhenReady("https://example.com/health", {
				fetcher,
				maxAttempts: 2,
				retryDelayMs: 1,
				sleep: vi.fn().mockResolvedValue(undefined),
			})
		).rejects.toThrow("returned 503 after 2 attempts: still unavailable")
	})
})
