import { syncEnvVars } from "@trigger.dev/build/extensions/core"
import type { BuildExtension } from "@trigger.dev/core/v3/build"
import { defineConfig } from "@trigger.dev/sdk/v3"

const skipEnvValidationDuringIndex: BuildExtension = {
	name: "skipEnvValidationDuringIndex",
	onBuildComplete(context) {
		context.addLayer({
			id: "skip-env-validation",
			build: { env: { SKIP_ENV_VALIDATION: "1" } },
		})
	},
}

const SYNCED_KEYS = ["JOB_DISPATCH_URL", "JOB_DISPATCH_SECRET"] as const

export default defineConfig({
	project: "proj_nhquzeoumjpzigemrkxj",
	runtime: "node",
	logLevel: "log",
	build: {
		extensions: [
			skipEnvValidationDuringIndex,
			syncEnvVars(() =>
				Object.fromEntries(
					SYNCED_KEYS.flatMap((key) => {
						const value = process.env[key]
						return value ? [[key, value]] : []
					})
				)
			),
		],
	},
	// The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
	// You can override this on an individual task.
	// See https://trigger.dev/docs/runs/max-duration
	maxDuration: 3600,
	retries: {
		enabledInDev: true,
		default: {
			maxAttempts: 3,
			minTimeoutInMs: 1000,
			maxTimeoutInMs: 10000,
			factor: 2,
			randomize: true,
		},
	},
	dirs: ["src/server/trigger"],
})
