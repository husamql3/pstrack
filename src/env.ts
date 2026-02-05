import { createIsomorphicFn } from "@tanstack/react-start";

export type AppEnv = Cloudflare.Env | NodeJS.ProcessEnv;

const getEnv = createIsomorphicFn()
	.server((): AppEnv => {
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
	.client((): ImportMetaEnv => import.meta.env);

export const env = getEnv();
