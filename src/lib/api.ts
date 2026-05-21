import { treaty } from "@elysiajs/eden"

import { env } from "@/env"
import type { App } from "@/server/app"

export const api = treaty<App>(env.VITE_API_URL).api
