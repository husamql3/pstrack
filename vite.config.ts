import { fileURLToPath, URL } from "url";

import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
// import dotenv from "dotenv";
import { defineConfig } from "vite";

// if (process.env.NODE_ENV === "development") {
// 	dotenv.config({ path: ".env.development" });
// }

const config = defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	define: {
		"process.env": process.env,
	},
	plugins: [
		cloudflare({
			viteEnvironment: {
				name: "ssr",
			},
		}),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
