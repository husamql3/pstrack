import { fileURLToPath, URL } from "url";

import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: {
		alias: [
			{
				find: "@",
				replacement: fileURLToPath(new URL("./src", import.meta.url)),
			},
		],
	},
	plugins: [
		cloudflare({
			viteEnvironment: { name: "ssr" },
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
	build: {
		rollupOptions: {
			onwarn(warning, warn) {
				// Ignore warnings from hugeicons
				if (warning.code === "INVALID_ANNOTATION" && warning.message.includes("@hugeicons/core-free-icons")) {
					return;
				}
				warn(warning);
			},
		},
	},
});

export default config;
