import { writeFile } from "node:fs/promises"

const required = (name: string) => {
	const value = process.env[name]
	if (!value) throw new Error(`${name} is not set`)
	return value
}

const baseUrl = required("PSTRACK_PRODUCTION_URL").replace(/\/$/, "")
const expectedGitSha = required("PSTRACK_GIT_SHA")
const expectedImageDigest = required("PSTRACK_IMAGE_DIGEST")
const jobSecret = process.env.JOB_DISPATCH_SECRET
const TRANSIENT_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])
const SMOKE_ATTEMPTS = 15
const SMOKE_RETRY_MS = 2000

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const checkFetch = async (path: string, init?: RequestInit) => {
	for (let attempt = 1; attempt <= SMOKE_ATTEMPTS; attempt++) {
		try {
			const res = await fetch(`${baseUrl}${path}`, init)
			if (res.ok) return res
			if (!TRANSIENT_STATUSES.has(res.status) || attempt === SMOKE_ATTEMPTS) {
				throw new Error(`${path} returned ${res.status}`)
			}
			console.warn(
				`${path} returned ${res.status}; retrying (${attempt}/${SMOKE_ATTEMPTS})`
			)
		} catch (error) {
			// A decided HTTP failure is terminal; surface it immediately.
			if (error instanceof Error && error.message.startsWith(`${path} returned `)) {
				throw error
			}
			// Connection-level failures (ConnectionRefused, DNS, TLS, timeout) are
			// expected while Coolify swaps containers during a rollout — the new
			// container may not accept connections yet. Retry them like transient statuses.
			if (attempt === SMOKE_ATTEMPTS) throw error
			console.warn(`${path} connection failed; retrying (${attempt}/${SMOKE_ATTEMPTS})`)
		}
		await wait(SMOKE_RETRY_MS)
	}
	throw new Error(`${path} exhausted retries`)
}

const isFreshnessJob = (value: unknown): value is { jobName: string; fresh: boolean } =>
	Boolean(
		value &&
			typeof value === "object" &&
			typeof Reflect.get(value, "jobName") === "string" &&
			typeof Reflect.get(value, "fresh") === "boolean"
	)

const main = async () => {
	const root = await checkFetch("/")
	const rootText = await root.text()
	if (!rootText.includes("PStrack"))
		throw new Error("Root smoke check did not find app marker")

	const health = await checkFetch("/api/v3/health")
	const healthBody = await health.json()
	if (healthBody.status !== "ok" || healthBody.db !== "ok") {
		throw new Error(`Health smoke check failed: ${JSON.stringify(healthBody)}`)
	}
	if (healthBody.revision?.gitSha !== expectedGitSha) {
		throw new Error(`Health git SHA mismatch: ${healthBody.revision?.gitSha}`)
	}
	if (healthBody.revision?.imageDigest !== expectedImageDigest) {
		throw new Error(`Health image digest mismatch: ${healthBody.revision?.imageDigest}`)
	}

	const session = await checkFetch("/api/v3/auth/get-session")
	const sessionBody = await session.json()
	if (sessionBody !== null)
		throw new Error("Anonymous auth session check returned a session")

	const og = await checkFetch("/api/v3/og?title=Production%20Smoke")
	if (og.headers.get("content-type") !== "image/png") {
		throw new Error("OpenGraph smoke check did not return image/png")
	}
	const png = new Uint8Array(await og.arrayBuffer())
	const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10]
	if (!pngSignature.every((byte, index) => png[index] === byte)) {
		throw new Error("OpenGraph smoke check returned an invalid PNG")
	}

	if (jobSecret) {
		const freshness = await checkFetch("/api/v3/internal/jobs/freshness", {
			headers: { Authorization: `Bearer ${jobSecret}` },
		})
		const body = await freshness.json()
		const rawJobs: unknown = Reflect.get(body, "jobs")
		const jobs = Array.isArray(rawJobs) ? rawJobs.filter(isFreshnessJob) : []
		const stale = jobs.filter((job) => !job.fresh)
		if (stale.length > 0) {
			console.warn(`Stale jobs: ${stale.map((job) => job.jobName).join(", ")}`)
		}
	}

	const evidence = {
		baseUrl,
		gitSha: expectedGitSha,
		imageDigest: expectedImageDigest,
		checkedAt: new Date().toISOString(),
		health: healthBody,
	}
	console.log(JSON.stringify(evidence, null, 2))
	await writeFile("smoke-evidence.json", `${JSON.stringify(evidence, null, 2)}\n`)
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
