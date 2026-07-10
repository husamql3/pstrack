import { createEnv } from "@t3-oss/env-core"
import { config } from "dotenv"
import { z } from "zod"

// Load environment variables from .env file if we are on the server
if (typeof window === "undefined") {
	config()
}

export const env = createEnv({
	server: {
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
		// EMAIL_TRANSPORT is the default provider. "log" (dev + staging) renders and
		// logs without sending; "smtp" sends via the self-hosted mail server
		// (Stalwart); "resend" is kept only for the migration canary. Note: in
		// production env validation is skipped, so the zod default does NOT apply —
		// set it explicitly in prod.
		EMAIL_TRANSPORT: z.enum(["smtp", "resend", "log"]).default("log"),
		// Comma-separated email tags force-routed to Resend during the cutover canary
		// (e.g. "magic-link"). Empty once fully on self-hosted SMTP.
		EMAIL_RESEND_TAGS: z.string().default(""),
		EMAIL_FROM: z.string().default("PStrack <info@pstrack.app>"),
		// Self-hosted SMTP submission (Stalwart). Optional so dev/staging (log
		// transport) and CI need no mail secrets. Port 465 = implicit TLS, else STARTTLS.
		SMTP_HOST: z.string().min(1).optional(),
		SMTP_PORT: z.coerce.number().int().positive().default(587),
		SMTP_USER: z.string().min(1).optional(),
		SMTP_PASS: z.string().min(1).optional(),
		// Resend — retained through the canary, removed once self-hosted SMTP is proven.
		RESEND_API_KEY: z.string().min(1).optional(),

		// payments
		POLAR_ACCESS_TOKEN: z.string().min(1),
		// Environment-specific: Polar sandbox and production are separate catalogs
		// with DIFFERENT product UUIDs. Must match the env POLAR_ACCESS_TOKEN targets.
		POLAR_PRODUCT_ID: z.string().min(1),
		POLAR_SUCCESS_URL: z.url(),
		POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),

		// husam-bot
		BOT_URL: z.string().url().optional(),
		BOT_NOTIFY_SECRET: z.string().min(1).optional(),

		// observability
		AXIOM_TOKEN: z.string().min(1).optional(),
		AXIOM_DATASET: z.string().min(1).optional(),
	},
	client: {
		VITE_BASE_URL: z.url().default("https://pstrack.localhost"),
		VITE_SENTRY_DSN: z.url().optional(),
		VITE_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
		VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
		VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
	},
	clientPrefix: "VITE_",
	// Load environment variables from .env file if we are on the client
	runtimeEnv: typeof window === "undefined" ? process.env : import.meta.env,
	skipValidation: !!process.env.SKIP_ENV_VALIDATION || import.meta.env?.PROD,
})
