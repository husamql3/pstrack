import { writeFile } from "node:fs/promises"

const required = (name: string) => {
	const value = process.env[name]
	if (!value) throw new Error(`${name} is not set`)
	return value
}

const optionalNumber = (name: string, fallback: number) => {
	const value = process.env[name]
	if (!value) return fallback
	const parsed = Number(value)
	if (!Number.isFinite(parsed) || parsed <= 0)
		throw new Error(`${name} must be a positive number`)
	return parsed
}

const createConfig = () => ({
	apiUrl: required("COOLIFY_API_URL").replace(/\/$/, ""),
	token: required("COOLIFY_API_TOKEN"),
	appUuid: required("COOLIFY_APP_UUID"),
	imageRef: required("PSTRACK_IMAGE_REF"),
	gitSha: required("PSTRACK_GIT_SHA"),
	imageDigest: required("PSTRACK_IMAGE_DIGEST"),
	deployedAt: new Date().toISOString(),
	timeoutMs: optionalNumber("COOLIFY_DEPLOY_TIMEOUT_MS", 15 * 60 * 1000),
	pollMs: optionalNumber("COOLIFY_DEPLOY_POLL_MS", 10 * 1000),
})

type Config = ReturnType<typeof createConfig>

const coolifyFetch = async (config: Config, path: string, init?: RequestInit) => {
	const headers = {
		Accept: "application/json",
		Authorization: `Bearer ${config.token}`,
		"Content-Type": "application/json",
	}
	const res = await fetch(`${config.apiUrl}${path}`, {
		...init,
		headers: { ...headers, ...init?.headers },
	})
	const text = await res.text()
	let body: unknown = text
	try {
		body = text ? JSON.parse(text) : null
	} catch {
		body = text
	}

	if (!res.ok) {
		throw new Error(`Coolify API ${path} failed (${res.status}): ${text}`)
	}
	return body
}

const readString = (body: unknown, keys: string[]) => {
	if (!body || typeof body !== "object") return null
	for (const key of keys) {
		const value = Reflect.get(body, key)
		if (typeof value === "string" && value.length > 0) return value
	}
	return null
}

const deploymentIdFrom = (body: unknown) =>
	readString(body, ["deployment_uuid", "deploymentId", "deployment_id", "id", "uuid"])

const statusFrom = (body: unknown) =>
	readString(body, ["status", "state", "deployment_status"])?.toLowerCase() ?? "unknown"

const terminalStatus = (value: string) => {
	if (
		["success", "succeeded", "finished", "completed", "healthy", "running"].includes(
			value
		)
	) {
		return "success"
	}
	if (["failed", "error", "cancelled", "canceled", "unhealthy"].includes(value))
		return "failure"
	return null
}

const patchApplication = async (config: Config) => {
	const body = {
		docker_registry_image_name: config.imageRef,
		docker_registry_image_tag: "",
		environment_variables: [
			`PSTRACK_GIT_SHA=${config.gitSha}`,
			`PSTRACK_IMAGE_DIGEST=${config.imageDigest}`,
			`PSTRACK_IMAGE_REF=${config.imageRef}`,
			`PSTRACK_DEPLOYED_AT=${config.deployedAt}`,
		],
	}

	return coolifyFetch(config, `/api/v1/applications/${config.appUuid}`, {
		method: "PATCH",
		body: JSON.stringify(body),
	})
}

const triggerDeployment = (config: Config) =>
	coolifyFetch(
		config,
		`/api/v1/deploy?uuid=${encodeURIComponent(config.appUuid)}&force=false`,
		{
			method: "GET",
		}
	)

const fetchDeployment = (config: Config, deploymentId: string) =>
	coolifyFetch(config, `/api/v1/deployments/${encodeURIComponent(deploymentId)}`, {
		method: "GET",
	})

const pollDeployment = async (config: Config, deploymentId: string) => {
	const startedAt = Date.now()
	for (;;) {
		const body = await fetchDeployment(config, deploymentId)
		const current = statusFrom(body)
		const terminal = terminalStatus(current)
		console.log(JSON.stringify({ deploymentId, status: current, body }))
		if (terminal === "success") return body
		if (terminal === "failure") {
			throw new Error(`Coolify deployment ${deploymentId} failed with status ${current}`)
		}
		if (Date.now() - startedAt > config.timeoutMs) {
			throw new Error(`Timed out waiting for Coolify deployment ${deploymentId}`)
		}
		await new Promise((resolve) => setTimeout(resolve, config.pollMs))
	}
}

export const deployCoolify = async () => {
	const config = createConfig()
	const patch = await patchApplication(config)
	const deployment = await triggerDeployment(config)
	const deploymentId = deploymentIdFrom(deployment)
	if (!deploymentId) {
		throw new Error(
			`Coolify did not return a deployment id: ${JSON.stringify(deployment)}`
		)
	}
	const finalDeployment = await pollDeployment(config, deploymentId)
	const evidence = {
		appUuid: config.appUuid,
		imageRef: config.imageRef,
		gitSha: config.gitSha,
		imageDigest: config.imageDigest,
		deployedAt: config.deployedAt,
		patch,
		deployment,
		finalDeployment,
	}
	console.log(JSON.stringify(evidence, null, 2))
	await writeFile("deploy-evidence.json", `${JSON.stringify(evidence, null, 2)}\n`)
}

if (import.meta.main) {
	deployCoolify().catch((error) => {
		console.error(error)
		process.exit(1)
	})
}
