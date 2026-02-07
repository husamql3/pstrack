import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	outDir: "dist",
	clean: true,
	sourcemap: true,
	minify: process.env.NODE_ENV === "production",
	target: "node20",
	platform: "node",
});
