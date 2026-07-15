import { afterEach, describe, expect, it, vi } from "vitest"

import {
	type CoolifyConfig,
	coolifyFetch,
	deploymentIdFrom,
	syncDeploymentEnvironment,
} from "../../../scripts/deploy-coolify"

const config: CoolifyConfig = {
	apiUrl: "https://coolify.example.com",
	token: "token",
	appUuid: "app",
	imageRef: "image@sha256:digest",
	gitSha: "git-sha",
	imageDigest: "sha256:digest",
	deployedAt: "2026-07-13T00:00:00.000Z",
	timeoutMs: 1000,
	pollMs: 1,
	requestAttempts: 4,
	requestRetryMs: 1,
}

afterEach(() => {
	vi.restoreAllMocks()
})

describe("coolifyFetch", () => {
	it("retries a transient connection failure", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockRejectedValueOnce(new TypeError("Unable to connect"))
			.mockResolvedValueOnce(Response.json({ uuid: "deployment" }))

		await expect(coolifyFetch(config, "/api/v1/applications/app")).resolves.toEqual({
			uuid: "deployment",
		})
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})

	it("retries a transient server response", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
			.mockResolvedValueOnce(Response.json({ status: "running" }))

		await expect(coolifyFetch(config, "/api/v1/deployments/id")).resolves.toEqual({
			status: "running",
		})
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})

	it("does not retry a permanent client error", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response("unauthorized", { status: 401 }))

		await expect(coolifyFetch(config, "/api/v1/applications/app")).rejects.toThrow(
			"Coolify API /api/v1/applications/app failed (401): unauthorized"
		)
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})
})

describe("deploymentIdFrom", () => {
	it("reads the deployment UUID from Coolify's queued deployment response", () => {
		expect(
			deploymentIdFrom({
				deployments: [
					{
						message: "Application deployment queued.",
						resource_uuid: "app",
						deployment_uuid: "deployment",
					},
				],
			})
		).toBe("deployment")
	})
})

describe("syncDeploymentEnvironment", () => {
	it("updates existing variables through the application env endpoint", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(
				Response.json([
					{ uuid: "env-uuid", key: "PSTRACK_GIT_SHA" },
					{ uuid: "digest-uuid", key: "PSTRACK_IMAGE_DIGEST" },
					{ uuid: "ref-uuid", key: "PSTRACK_IMAGE_REF" },
					{ uuid: "date-uuid", key: "PSTRACK_DEPLOYED_AT" },
				])
			)
			.mockImplementation(async () => Response.json({}))

		await syncDeploymentEnvironment(config)

		expect(fetchMock).toHaveBeenCalledTimes(5)
		for (const call of fetchMock.mock.calls.slice(1)) {
			expect(call[0]).toBe("https://coolify.example.com/api/v1/applications/app/envs")
			expect(call[1]?.method).toBe("PATCH")
		}
	})
})
