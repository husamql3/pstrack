import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_BACKEND_URL: z.url(),
		VITE_FRONTEND_URL: z.url(),
		VITE_PUBLIC_POSTHOG_KEY: z.string(),
		VITE_PUBLIC_POSTHOG_HOST: z.string(),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});
