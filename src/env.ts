import { createIsomorphicFn } from "@tanstack/react-start";

const getEnv = createIsomorphicFn()
	.server(() => {
		if (process.env.NODE_ENV === "development") {
			return process.env;
		}

		try {
			const { env } = require("cloudflare:workers").default;
			return env;
		} catch {
			return process.env;
		}
	})
	.client(() => import.meta.env);

export const env = getEnv();
