import { writeFile } from "node:fs/promises"

const required = (name: string) => {
	const value = process.env[name]
	if (!value) throw new Error(`${name} is not set`)
	return value
}

const baseUrl = required("PSTRACK_STAGING_URL").replace(/\/$/, "")
const canonicalUrl = required("PSTRACK_CANONICAL_STAGING_URL").replace(/\/$/, "")
const expectedGitSha = required("PSTRACK_GIT_SHA")

const checkFetch = async (path: string) => {
	const response = await fetch(`${baseUrl}${path}`)
	if (!response.ok) throw new Error(`${path} returned ${response.status}`)
	return response
}

const main = async () => {
	const root = await checkFetch("/")
	if (!(await root.text()).includes("PStrack")) {
		throw new Error("Root smoke check did not find app marker")
	}

	const health = await checkFetch("/api/v3/health")
	const healthBody = await health.json()
	if (healthBody.status !== "ok" || healthBody.db !== "ok") {
		throw new Error(`Health smoke check failed: ${JSON.stringify(healthBody)}`)
	}
	if (healthBody.runtime?.environment !== "staging") {
		throw new Error("Deployment does not identify itself as staging")
	}
	if (healthBody.runtime?.emailTransport !== "log") {
		throw new Error("Staging email transport is not log-only")
	}
	if (healthBody.revision?.gitSha !== expectedGitSha) {
		throw new Error(`Health git SHA mismatch: ${healthBody.revision?.gitSha}`)
	}

	const session = await checkFetch("/api/v3/auth/get-session")
	if ((await session.json()) !== null) {
		throw new Error("Anonymous auth session check returned a session")
	}

	const canonicalHealth = await fetch(`${canonicalUrl}/api/v3/health`)
	if (!canonicalHealth.ok) {
		throw new Error(`Canonical health returned ${canonicalHealth.status}`)
	}
	const canonicalHealthBody = await canonicalHealth.json()
	if (canonicalHealthBody.revision?.gitSha !== expectedGitSha) {
		throw new Error(
			`Canonical staging revision mismatch: ${canonicalHealthBody.revision?.gitSha}`
		)
	}

	const evidence = {
		baseUrl,
		canonicalUrl,
		gitSha: expectedGitSha,
		checkedAt: new Date().toISOString(),
		health: healthBody,
	}
	console.log(JSON.stringify(evidence, null, 2))
	await writeFile("staging-smoke-evidence.json", `${JSON.stringify(evidence, null, 2)}\n`)
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
