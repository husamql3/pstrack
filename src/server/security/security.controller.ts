import { Elysia } from "elysia"

import { securityModel } from "./security.model"
import { recordCspViolation } from "./security.service"
import { summarizeCspViolation } from "./security.utils"

const MAX_REPORT_BYTES = 16_384

export const securityController = new Elysia({
	prefix: "/security",
	tags: ["Security"],
})
	.use(securityModel)
	.post(
		"/csp-report",
		({ body, request }) => {
			const accepted = () => new Response(null, { status: 204 })
			const declaredLength = Number(request.headers.get("content-length") ?? 0)
			if (declaredLength > MAX_REPORT_BYTES || body.length > MAX_REPORT_BYTES) {
				return accepted()
			}

			try {
				const parsedBody: unknown = JSON.parse(body)
				const reports = Array.isArray(parsedBody) ? parsedBody.slice(0, 10) : [parsedBody]

				for (const report of reports) {
					const summary = summarizeCspViolation(report)
					if (summary) recordCspViolation(summary)
				}
			} catch {
				// Browser reporting must never fail a user-facing request or create a loop.
			}

			return accepted()
		},
		{ parse: "text", body: "security.cspReport" }
	)
