import { createIsomorphicFn } from "@tanstack/react-start";

/** Environment from server (Cloudflare Worker Env or Node process.env) or client (Vite import.meta.env). */
export type AppEnv = Cloudflare.Env | NodeJS.ProcessEnv | ImportMetaEnv;

const getEnv = createIsomorphicFn()
	.server((): Env | NodeJS.ProcessEnv => {
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
