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
	},
	client: {},
	clientPrefix: "VITE_",
	// Load environment variables from .env file if we are on the client
	runtimeEnv: typeof window === "undefined" ? process.env : import.meta.env,
	skipValidation: import.meta.env.PROD,
})
