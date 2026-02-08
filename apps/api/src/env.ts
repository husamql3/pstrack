import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createEnv } from "@t3-oss/env-core";
import dotenv from "dotenv";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");

if (existsSync(envPath)) {
	dotenv.config({ path: envPath });
}

export const env = createEnv({
	server: {
		// Environment
		PORT: z.coerce.number().default(3000),
		NODE_ENV: z.enum(["development", "production"]).default("development"),

		// URLs
		BASE_URL: z.url(),

		// Database
		DATABASE_URL: z.url(),

		// Authentication
		BETTER_AUTH_SECRET: z.string(),

		// Monitoring
		SENTRY_DSN: z.string(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
