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

const SYNCED_KEYS = [
	"DATABASE_URL",
	"DIRECT_URL",
	"BETTER_AUTH_SECRET",
	"BETTER_AUTH_URL",
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"GITHUB_CLIENT_ID",
	"GITHUB_CLIENT_SECRET",
	"RESEND_API_KEY",
	"EMAIL_FROM",
	"POLAR_ACCESS_TOKEN",
	"POLAR_SUCCESS_URL",
	"SENTRY_DSN",
	"SENTRY_ENVIRONMENT",
	"SENTRY_TRACES_SAMPLE_RATE",
	"NODE_ENV",
] as const

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
