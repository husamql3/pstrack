import { createEnv } from "@t3-oss/env-core"
import { config } from "dotenv"
import { z } from "zod"

// Load environment variables from .env file if we are on the server
if (typeof window === "undefined") {
	config()
}

const server = {
	// node environment
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

	// database
	DATABASE_URL: z.string().min(1),
	DIRECT_URL: z.string().min(1),

	// redis
	UPSTASH_REDIS_REST_URL: z.string().min(1).optional(),
	UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
	REDIS_URL: z.url().optional(),

	// error tracking
	SENTRY_DSN: z.url().optional(),
	SENTRY_ENVIRONMENT: z.string().min(1).optional(),
	SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),

	// auth
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.url().default("https://pstrack.localhost"),
	BETTER_AUTH_API_KEY: z.string().min(1),
	GOOGLE_CLIENT_ID: z.string().min(1),
	GOOGLE_CLIENT_SECRET: z.string().min(1),
	GITHUB_CLIENT_ID: z.string().min(1),
	GITHUB_CLIENT_SECRET: z.string().min(1),

	// email
	EMAIL_TRANSPORT: z.enum(["resend", "smtp", "log"]).default("resend"),
	RESEND_API_KEY: z.string().min(1).optional(),
	EMAIL_FROM: z.string().default("PStrack <info@pstrack.app>"),
	// Self-hosted SMTP (Stalwart). Required when EMAIL_TRANSPORT is "smtp".
	// Port 465 = implicit TLS, otherwise STARTTLS.
	SMTP_HOST: z.string().min(1).optional(),
	SMTP_PORT: z.coerce.number().int().positive().default(587),
	SMTP_USER: z.string().min(1).optional(),
	SMTP_PASS: z.string().min(1).optional(),

	// payments
	POLAR_ACCESS_TOKEN: z.string().min(1),
	// Environment-specific: Polar sandbox and production are separate catalogs
	// with DIFFERENT product UUIDs. Must match the env POLAR_ACCESS_TOKEN targets.
	POLAR_PRODUCT_ID: z.string().min(1),
	POLAR_SUCCESS_URL: z.url(),
	POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),
	// Explicit override for the Polar API server. Defaults to NODE_ENV-based
	// selection when unset. Vercel force-sets NODE_ENV=production, so stage
	// sets POLAR_SERVER="sandbox" to keep payments on the sandbox catalog.
	POLAR_SERVER: z.enum(["sandbox", "production"]).optional(),

	// husam-bot
	BOT_URL: z.string().url().optional(),
	BOT_NOTIFY_SECRET: z.string().min(1).optional(),
	JOB_DISPATCH_SECRET: z.string().min(32).optional(),

	// observability
	AXIOM_TOKEN: z.string().min(1).optional(),
	AXIOM_DATASET: z.string().min(1).optional(),

	// deployment identity (non-secret; exposed by the health endpoint)
	PSTRACK_ENVIRONMENT: z.enum(["development", "staging", "production"]).optional(),
}

const client = {
	VITE_BASE_URL: z.url().default("https://pstrack.localhost"),
	VITE_SENTRY_DSN: z.url().optional(),
	VITE_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
	VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
	VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
}

/**
 * Decide whether to skip environment validation.
 *
 * `SKIP_ENV_VALIDATION` is a build/test/dev-only escape hatch: it lets CI build
 * the client bundle and unit tests run without every server secret present. It
 * must NEVER disable validation in a running production server — doing so once
 * let the production app boot without `POLAR_PRODUCT_ID`, silently breaking
 * checkout (audit #281). So a production server process always validates and
 * fails fast, regardless of the flag; the escape hatch only applies to the
 * client bundle and to non-production server processes.
 */
export const resolveSkipValidation = ({
	isServer,
	nodeEnv,
	skipFlag,
}: {
	isServer: boolean
	nodeEnv: string | undefined
	skipFlag: string | undefined
}): boolean => {
	if (isServer && nodeEnv === "production") return false
	return !!skipFlag
}

/**
 * Build a validated env object. Extracted from the singleton below so tests can
 * exercise validation with controlled inputs (e.g. assert a production server
 * throws when a required var is missing).
 */
export const buildEnv = ({
	runtimeEnv,
	isServer,
	skipValidation,
}: {
	runtimeEnv: Record<string, string | undefined>
	isServer: boolean
	skipValidation: boolean
}) => {
	const validated = createEnv({
		server,
		client,
		clientPrefix: "VITE_",
		runtimeEnv,
		isServer,
		skipValidation,
	})

	if (!skipValidation && isServer) {
		if (validated.EMAIL_TRANSPORT === "resend" && !validated.RESEND_API_KEY) {
			throw new Error("RESEND_API_KEY is required when EMAIL_TRANSPORT is resend")
		}
		if (validated.EMAIL_TRANSPORT === "log" && validated.RESEND_API_KEY) {
			throw new Error("RESEND_API_KEY must be absent when EMAIL_TRANSPORT is log")
		}
		if (
			validated.EMAIL_TRANSPORT === "smtp" &&
			(!validated.SMTP_HOST || !validated.SMTP_USER || !validated.SMTP_PASS)
		) {
			throw new Error(
				"SMTP_HOST, SMTP_USER and SMTP_PASS are required when EMAIL_TRANSPORT is smtp"
			)
		}
	}

	return validated
}

const isServer = typeof window === "undefined"

export const env = buildEnv({
	// On the client, values come from the statically-replaced import.meta.env.
	runtimeEnv: isServer ? process.env : import.meta.env,
	isServer,
	skipValidation: resolveSkipValidation({
		isServer,
		nodeEnv: process.env.NODE_ENV,
		skipFlag: process.env.SKIP_ENV_VALIDATION,
	}),
})
