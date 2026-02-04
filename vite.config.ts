import { fileURLToPath, URL } from "url";

import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
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
