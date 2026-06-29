import { treaty } from "@elysiajs/eden"

import { env } from "@/env"
import type { App } from "@/server/app"

const getOrCreateSessionId = (): string => {
	let id = sessionStorage.getItem("observabilitySessionId")
	if (!id) {
		id = crypto.randomUUID()
		sessionStorage.setItem("observabilitySessionId", id)
	}
	return id
}

export const api = treaty<App>(env.VITE_BASE_URL, {
	headers() {
		return { "x-session-id": getOrCreateSessionId() }
	},
}).api
