import viteTsConfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
	plugins: [viteTsConfigPaths({ projects: ["./tsconfig.json"] })],
	test: {
		projects: [
			{
				// Unit tests — all existing mock-based *.test.ts files.
				// No real DB, no setup files; runs exactly as before.
				plugins: [viteTsConfigPaths({ projects: ["./tsconfig.json"] })],
				test: {
					name: "unit",
					environment: "node",
					include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
					exclude: ["src/**/*.integration.test.ts"],
				},
			},
			{
				// Integration tests — *.integration.test.ts files only.
				// resetDb() is called in beforeEach via the setup file.
				plugins: [viteTsConfigPaths({ projects: ["./tsconfig.json"] })],
				test: {
					name: "integration",
					environment: "node",
					include: ["src/**/*.integration.test.ts"],
					setupFiles: ["./src/test/setup.ts"],
				},
			},
		],
	},
})
