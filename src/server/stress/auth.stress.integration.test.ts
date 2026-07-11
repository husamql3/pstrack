import { describe, expect, it } from "vitest"

import { auth } from "@/server/lib/auth"
import {
	expectNoRejectedStressWork,
	runConcurrent,
	stressRepetitions,
} from "@/test/stress"

describe("Better Auth stress suite", () => {
	it("handles concurrent unauthenticated session reads consistently", async () => {
		const repetitions = stressRepetitions(10)
		const results = await runConcurrent(repetitions, async () => {
			const response = await auth.handler(
				new Request("https://pstrack.test/api/v3/auth/get-session")
			)
			return {
				status: response.status,
				body: await response.json(),
			}
		})

		expectNoRejectedStressWork(results)
		for (const result of results) {
			if (result.status !== "fulfilled") continue
			expect(result.value.status).toBe(200)
			expect(result.value.body).toBeNull()
		}
	})
})
