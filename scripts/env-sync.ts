import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parse } from "dotenv"

const PROD_ENV_FILE = resolve(import.meta.dirname, "../.env.prod")

export function readProdEnv(): Record<string, string> {
	return parse(readFileSync(PROD_ENV_FILE, "utf-8"))
}
