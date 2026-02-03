import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "./src/index.ts",
	format: "esm",
	outDir: "./dist",
	clean: true,
	noExternal: [/web/, /site/, /server/, /db/],
	inlineOnly: ["@neondatabase/serverless", "drizzle-orm"],
});
