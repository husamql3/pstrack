import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		// Database
		DATABASE_URL: z.url(),
		// Supabase
		SUPABASE_URL: z.url(),
		SUPABASE_KEY: z.string(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
