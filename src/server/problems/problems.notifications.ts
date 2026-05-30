import DailyProblemEmail from "@/emails/daily-problem"
import { env } from "@/env"
import { resend } from "@/server/lib/email"
import { captureServerException } from "@/server/lib/sentry"

const BASE_URL = env.BETTER_AUTH_URL.replace(/\/$/, "")

export type DailyProblemRecipient = {
	email: string
	name: string
	groupSlug: string
	problemSlug: string
	problemTitle: string
	difficulty: string
	topic: string
}

export const problemNotifications = {
	dailyProblemDigest: async (recipients: DailyProblemRecipient[]) => {
		await Promise.all(
			recipients.map(async (r) => {
				try {
					await resend.emails.send({
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
							dashboardUrl: `${BASE_URL}/dashboard`,
						}),
					})
				} catch (err) {
					captureServerException(err, { tag: "email:daily-problem" })
				}
			})
		)
	},
}
