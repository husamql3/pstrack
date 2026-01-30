import "../worker-configuration";
export { env } from "cloudflare:workers";

// import { createEnv } from "@t3-oss/env-core";
// import { z } from "zod";

// export const env = createEnv({
// 	server: {
// 		// Database
// 		DATABASE_URL: z.url(),
// 		// Supabase
// / <reference path="../worker-configuration.d.ts" />
// 		SUPABASE_URL: z.url(),
// 		SUPABASE_KEY: z.string(),
// 		// Upstash
// 		UPSTASH_REDIS_URL: z.url(),
// 		UPSTASH_REDIS_TOKEN: z.string(),
// 	},
// 	runtimeEnv: process.env,
// 	emptyStringAsUndefined: true,
// });
