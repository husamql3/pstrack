const TARGET_DATE = "2026-07-10"

export {}

const baseUrl = process.env.JOB_DISPATCH_URL?.replace(/\/$/, "")
const secret = process.env.JOB_DISPATCH_SECRET
const confirmed = process.argv.includes(`--confirm=${TARGET_DATE}`)

if (!baseUrl || !secret) {
	throw new Error("JOB_DISPATCH_URL and JOB_DISPATCH_SECRET are required")
}
if (!confirmed) {
	throw new Error(`Refusing to run without --confirm=${TARGET_DATE}`)
}

const response = await fetch(`${baseUrl}/api/v3/internal/jobs/reconcile-mark-missed`, {
	method: "POST",
	headers: {
		"content-type": "application/json",
		authorization: `Bearer ${secret}`,
	},
	body: JSON.stringify({
		idempotencyKey: `reconcile-mark-missed:${TARGET_DATE}`,
		scheduledAt: `${TARGET_DATE}T00:00:00.000Z`,
	}),
})

const body = await response.text()
if (!response.ok) throw new Error(`Reconciliation failed (${response.status}): ${body}`)
console.log(body)
