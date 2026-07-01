import { env } from "@/env"

export const notifyAdmin = (event: string, payload: Record<string, unknown>): void => {
	if (!env.BOT_URL) return
	fetch(`${env.BOT_URL}/api/notify`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${env.BOT_NOTIFY_SECRET}`,
		},
		body: JSON.stringify({ event, payload }),
	}).catch(() => {})
}
