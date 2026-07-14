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
	requestAttempts: optionalNumber("COOLIFY_REQUEST_ATTEMPTS", 4),
	requestRetryMs: optionalNumber("COOLIFY_REQUEST_RETRY_MS", 1000),
})

export type CoolifyConfig = ReturnType<typeof createConfig>

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const coolifyFetch = async (
	config: CoolifyConfig,
	path: string,
	init?: RequestInit
) => {
	const headers = {
		Accept: "application/json",
		Authorization: `Bearer ${config.token}`,
		"Content-Type": "application/json",
	}
	for (let attempt = 1; attempt <= config.requestAttempts; attempt++) {
		try {
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

			if (res.ok) return body
			if (!RETRYABLE_STATUSES.has(res.status) || attempt === config.requestAttempts) {
				throw new Error(`Coolify API ${path} failed (${res.status}): ${text}`)
			}
			console.warn(
				`Coolify API ${path} returned ${res.status}; retrying (${attempt}/${config.requestAttempts})`
			)
		} catch (error) {
			if (error instanceof Error && error.message.startsWith("Coolify API ")) {
				throw error
			}
			if (attempt === config.requestAttempts) throw error
			console.warn(
				`Coolify API ${path} connection failed; retrying (${attempt}/${config.requestAttempts})`
			)
		}

		await wait(config.requestRetryMs * 2 ** (attempt - 1))
	}

	throw new Error(`Coolify API ${path} exhausted retries`)
}

const readString = (body: unknown, keys: string[]) => {
	if (!body || typeof body !== "object") return null
	for (const key of keys) {
		const value = Reflect.get(body, key)
		if (typeof value === "string" && value.length > 0) return value
	}
	return null
}

export const deploymentIdFrom = (body: unknown) => {
	const keys = ["deployment_uuid", "deploymentId", "deployment_id", "id", "uuid"]
	const directId = readString(body, keys)
	if (directId) return directId
	if (!body || typeof body !== "object") return null
	const deployments = Reflect.get(body, "deployments")
	if (!Array.isArray(deployments)) return null
	for (const deployment of deployments) {
		const id = readString(deployment, keys)
		if (id) return id
	}
	return null
}

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

const patchApplication = async (config: CoolifyConfig) => {
	const digestSeparator = config.imageRef.lastIndexOf("@")
	const imageName =
		digestSeparator === -1 ? config.imageRef : config.imageRef.slice(0, digestSeparator)
	const body = {
		docker_registry_image_name: imageName,
		docker_registry_image_tag: config.gitSha,
	}

	return coolifyFetch(config, `/api/v1/applications/${config.appUuid}`, {
		method: "PATCH",
		body: JSON.stringify(body),
	})
}

type CoolifyEnvironmentVariable = { key: string }

export const syncDeploymentEnvironment = async (config: CoolifyConfig) => {
	const rawExisting = await coolifyFetch(
		config,
		`/api/v1/applications/${config.appUuid}/envs`,
		{ method: "GET" }
	)
	const existing = Array.isArray(rawExisting)
		? rawExisting.filter((value): value is CoolifyEnvironmentVariable =>
				Boolean(
					value &&
						typeof value === "object" &&
						typeof Reflect.get(value, "key") === "string"
				)
			)
		: []
	const existingKeys = new Set(existing.map((variable) => variable.key))
	const values = {
		PSTRACK_GIT_SHA: config.gitSha,
		PSTRACK_IMAGE_DIGEST: config.imageDigest,
		PSTRACK_IMAGE_REF: config.imageRef,
		PSTRACK_DEPLOYED_AT: config.deployedAt,
	}

	for (const [key, value] of Object.entries(values)) {
		const exists = existingKeys.has(key)
		await coolifyFetch(config, `/api/v1/applications/${config.appUuid}/envs`, {
			method: exists ? "PATCH" : "POST",
			body: JSON.stringify({
				key,
				value,
				is_buildtime: true,
				is_runtime: true,
				is_preview: false,
			}),
		})
	}
}

const triggerDeployment = (config: CoolifyConfig) =>
	coolifyFetch(
		config,
		`/api/v1/deploy?uuid=${encodeURIComponent(config.appUuid)}&force=false`,
		{
			method: "GET",
		}
	)

const fetchDeployment = (config: CoolifyConfig, deploymentId: string) =>
	coolifyFetch(config, `/api/v1/deployments/${encodeURIComponent(deploymentId)}`, {
		method: "GET",
	})

const pollDeployment = async (config: CoolifyConfig, deploymentId: string) => {
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
	await syncDeploymentEnvironment(config)
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
