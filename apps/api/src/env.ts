import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createEnv } from "@t3-oss/env-core";
import dotenv from "dotenv";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");

if (existsSync(envPath)) {
	dotenv.config({ path: envPath });
}

export const env = createEnv({
	server: {
		NODE_ENV: z.enum(["development", "production"]).default("development"),
		PORT: z.coerce.number().default(3000),
		DATABASE_URL: z.url(),
		BASE_URL: z.url(),
		BETTER_AUTH_SECRET: z.string(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
