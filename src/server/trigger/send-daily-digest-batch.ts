import { logger, task } from "@trigger.dev/sdk/v3"

import DailyProblemEmail from "@/emails/daily-problem"
import { env } from "@/env"
import { notifyAdmin } from "@/server/lib/bot"
import { sendEmail } from "@/server/lib/email"
import {
	createRedisKey,
	redisExpire,
	redisSAdd,
	redisSIsMember,
} from "@/server/lib/redis"
import { captureServerException } from "@/server/lib/sentry"
import type { DailyProblemRecipient } from "@/server/problems/problems.type"

type Payload = {
	recipients: DailyProblemRecipient[]
	dateKey: string
	batchIndex: number
}

// Postal has no idempotency key, so we track which recipients already received
// the digest for a given day in a Redis set. A Trigger retry then re-sends only
// the ones that didn't go out — zero duplicates. TTL outlives the retry window.
const SENT_SET_TTL_SECONDS = 60 * 60 * 48
const SEND_CONCURRENCY = 10

export const sendDailyDigestBatchTask = task({
	id: "send-daily-digest-batch",
	maxDuration: 120,
	queue: { name: "send-daily-digest", concurrencyLimit: 2 },
	retry: {
		maxAttempts: 3,
		factor: 2,
		minTimeoutInMs: 1000,
		maxTimeoutInMs: 30000,
		randomize: true,
	},
	catchError: async ({ task, error, retryAt }) => {
		if (!retryAt) {
			notifyAdmin("job.failed", {
				jobName: task,
				error: error instanceof Error ? error.message : String(error),
				failedAt: new Date().toISOString(),
			})
		}
	},
	run: async ({ recipients, dateKey, batchIndex }: Payload) => {
		if (recipients.length === 0) return { sent: 0, failed: 0, skipped: 0 }

		const baseUrl = env.BETTER_AUTH_URL.replace(/\/$/, "")
		const dashboardUrl = `${baseUrl}/dashboard`
		const sentKey = createRedisKey("digest", "sent", dateKey)

		let sent = 0
		let failed = 0
		let skipped = 0
		let lastError: unknown = null

		const queue = [...recipients]
		const worker = async () => {
			while (queue.length > 0) {
				const r = queue.shift()
				if (!r) break

				try {
					if (await redisSIsMember(sentKey, r.email)) {
						skipped++
						continue
					}

					await sendEmail({
						from: env.EMAIL_FROM,
						to: r.email,
						subject: `Today's problem: ${r.problemTitle}`,
						tag: "daily-digest",
						react: DailyProblemEmail({
							name: r.name,
							groupName: `@${r.groupSlug}`,
							problemTitle: r.problemTitle,
							difficulty: r.difficulty,
							topic: r.topic,
							problemUrl: `https://leetcode.com/problems/${r.problemSlug}/`,
							dashboardUrl,
						}),
					})

					await redisSAdd(sentKey, r.email)
					sent++
				} catch (err) {
					failed++
					lastError = err
					captureServerException(err, {
						tag: "email:daily-digest",
						email: r.email,
						dateKey,
						batchIndex,
					})
				}
			}
		}

		await Promise.all(
			Array.from({ length: Math.min(SEND_CONCURRENCY, recipients.length) }, worker)
		)
		await redisExpire(sentKey, SENT_SET_TTL_SECONDS)

		logger.log("Daily digest batch sent", { sent, failed, skipped, batchIndex, dateKey })

		// Nothing got through — treat as a transient outage and let Trigger retry.
		// The sent-set makes the retry duplicate-safe. Per-recipient failures amid
		// partial success are left as-is (usually permanent, e.g. bad address).
		if (sent === 0 && failed > 0) throw lastError

		return { sent, failed, skipped }
	},
})
