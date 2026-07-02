import { env } from "@/env"

/**
 * Fire an admin notification to husam-bot.
 *
 * Awaitable by design: on serverless request handlers an un-awaited fetch is
 * dropped when the function freezes after the response returns. Callers in
 * request paths MUST `await` this; Trigger.dev tasks should too. Failures are
 * logged (never thrown) so a bot outage can't break the primary operation.
 */
export const notifyAdmin = async (
	event: string,
	payload: Record<string, unknown>
): Promise<void> => {
	if (!env.BOT_URL) return
	try {
		const res = await fetch(`${env.BOT_URL}/api/notify`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${env.BOT_NOTIFY_SECRET}`,
			},
			body: JSON.stringify({ event, payload }),
		})
		if (!res.ok) {
			const body = await res.text().catch(() => "")
			console.error(`[notifyAdmin] ${event} failed: ${res.status} ${body}`)
		}
	} catch (err) {
		console.error(`[notifyAdmin] ${event} error`, err)
	}
}
