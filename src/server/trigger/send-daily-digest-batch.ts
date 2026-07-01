import { logger, task } from "@trigger.dev/sdk/v3"

import DailyProblemEmail from "@/emails/daily-problem"
import { env } from "@/env"
import { notifyAdmin } from "@/server/lib/bot"
import { resend } from "@/server/lib/email"
import { captureServerException } from "@/server/lib/sentry"
import type { DailyProblemRecipient } from "@/server/problems/problems.type"

type Payload = {
	recipients: DailyProblemRecipient[]
	dateKey: string
	batchIndex: number
}

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
		if (recipients.length === 0) return { sent: 0, failed: 0 }

		const baseUrl = env.BETTER_AUTH_URL.replace(/\/$/, "")
		const dashboardUrl = `${baseUrl}/dashboard`

		const emails = recipients.map((r) => ({
			from: env.EMAIL_FROM,
			to: r.email,
			subject: `Today's problem: ${r.problemTitle}`,
			react: DailyProblemEmail({
				name: r.name,
				groupName: `@${r.groupSlug}`,
				problemTitle: r.problemTitle,
				difficulty: r.difficulty,
				topic: r.topic,
				problemUrl: `https://leetcode.com/problems/${r.problemSlug}/`,
				dashboardUrl,
			}),
		}))

		const { data, error } = await resend.batch.send(emails, {
			idempotencyKey: `daily-digest:${dateKey}:${batchIndex}`,
		})

		if (error) throw error

		let failed = 0
		data?.data.forEach((entry, i) => {
			if ("error" in entry && entry.error) {
				failed++
				captureServerException(entry.error, {
					tag: "email:daily-digest",
					email: recipients[i]?.email,
					dateKey,
					batchIndex,
				})
			}
		})

		const sent = recipients.length - failed
		logger.log("Daily digest batch sent", { sent, failed, batchIndex, dateKey })
		return { sent, failed }
	},
})
