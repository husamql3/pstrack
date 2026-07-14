import { describe, expect, it } from "vitest"

import { summarizeCspViolation } from "./security.utils"

describe("summarizeCspViolation", () => {
	it("summarizes modern Reporting API bodies without retaining URLs", () => {
		expect(
			summarizeCspViolation({
				type: "csp-violation",
				url: "https://pstrack.app/settings/account?token=private",
				body: {
					blockedURL: "https://o123.ingest.sentry.io/api/private",
					documentURL: "https://pstrack.app/settings/account?token=private",
					effectiveDirective: "connect-src",
					disposition: "enforce",
					sample: "private sample",
				},
			})
		).toEqual({
			blockedResource: "sentry",
			disposition: "enforce",
			documentArea: "settings",
			effectiveDirective: "connect-src",
		})
	})

	it("collapses invented directive names into the bounded unknown category", () => {
		expect(
			summarizeCspViolation({
				"csp-report": {
					"effective-directive": "attacker-invented-directive",
				},
			})?.effectiveDirective
		).toBe("unknown")
	})
})
