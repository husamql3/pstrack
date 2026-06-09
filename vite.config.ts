import mdx from "@mdx-js/rollup"
import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"

const config = defineConfig({
	server: {
		hmr: {
			clientPort: 443,
		},
	},
	optimizeDeps: {
		exclude: ["@resvg/resvg-js"],
	},
	build: {
		rollupOptions: {
			external: ["@resvg/resvg-js"],
		},
	},
	plugins: [
		devtools(),
		nitro(),
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart(),
		{ enforce: "pre", ...mdx({ jsxImportSource: "react" }) },
		viteReact({ include: /\.(jsx|tsx)$/ }),
	],
})

export default config
