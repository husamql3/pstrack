import mdx from "@mdx-js/rollup"
import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { createLogger, defineConfig } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"

const logger = createLogger()
const loggerWarn = logger.warn
logger.warn = (message, options) => {
	if (
		message.includes("Module level directives cause errors when bundled") &&
		message.includes('"use client"') &&
		message.includes("node_modules/")
	) {
		return
	}

	loggerWarn(message, options)
}

const config = defineConfig({
	customLogger: logger,
	server: {
		hmr: {
			clientPort: 443,
		},
	},
	optimizeDeps: {
		exclude: ["@resvg/resvg-js"],
	},
	build: {
		reportCompressedSize: false,
		rollupOptions: {
			onwarn(warning, warn) {
				if (
					warning.code === "MODULE_LEVEL_DIRECTIVE" &&
					warning.id?.includes("node_modules") &&
					warning.message.includes('"use client"')
				) {
					return
				}

				warn(warning)
			},
		},
	},
	plugins: [
		devtools(),
		nitro({
			rollupConfig: {
				external: [/\.node$/, /^@resvg\/resvg-js(?:-.+)?$/],
			},
			traceDeps: [
				"@resvg/resvg-js*",
				"@resvg/resvg-js-darwin-arm64*",
				"@resvg/resvg-js-darwin-x64*",
				"@resvg/resvg-js-linux-arm64-gnu*",
				"@resvg/resvg-js-linux-x64-gnu*",
				"@resvg/resvg-js-linux-arm64-musl*",
				"@resvg/resvg-js-linux-x64-musl*",
			],
		}),
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
