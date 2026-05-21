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

		// error tracking
		SENTRY_DSN: z.url().optional(),
		SENTRY_ENVIRONMENT: z.string().min(1).optional(),
		SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
	},
	client: {
		VITE_API_URL: z.url().default("http://localhost:3000/api/v3"),
		VITE_SENTRY_DSN: z.url().optional(),
		VITE_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
		VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
		VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
	},
	clientPrefix: "VITE_",
	// Load environment variables from .env file if we are on the client
	runtimeEnv: typeof window === "undefined" ? process.env : import.meta.env,
	skipValidation: import.meta.env.PROD,
})
