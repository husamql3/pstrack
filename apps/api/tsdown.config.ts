import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "./src/index.ts",
	format: "esm",
	outDir: "./dist",
	clean: true,
	unbundle: true,
	platform: "node",
	treeshake: true,
	inlineOnly: false,
});
