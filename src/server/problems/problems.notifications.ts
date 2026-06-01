import BadgeEarnedEmail from "@/emails/badge-earned"
import DailyProblemEmail from "@/emails/daily-problem"
import ProUnlockedByPointsEmail from "@/emails/pro-unlocked-by-points"
import StreakMilestoneEmail from "@/emails/streak-milestone"
import { env } from "@/env"
import { db } from "@/server/lib/db"
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

const STREAK_MILESTONES = [7, 30, 100] as const

export const problemNotifications = {
	sendSolveAchievementEmails: async (
		userId: string,
		email: string,
		name: string,
		opts: {
			crossedProThreshold: boolean
			newBadges: string[]
			newStreak: number
		}
	) => {
		const { crossedProThreshold, newBadges, newStreak } = opts
		const isStreakMilestone = (STREAK_MILESTONES as readonly number[]).includes(newStreak)

		if (!crossedProThreshold && newBadges.length === 0 && !isStreakMilestone) return

		const user = await db.user.findUnique({
			where: { id: userId },
			select: { notifyAchievements: true },
		})
		if (!user?.notifyAchievements) return

		const dashboardUrl = `${BASE_URL}/dashboard`

		await Promise.all([
			crossedProThreshold &&
				resend.emails
					.send({
						from: env.EMAIL_FROM,
						to: email,
						subject: "You've unlocked Pro on PSTrack",
						react: ProUnlockedByPointsEmail({ name, dashboardUrl }),
					})
					.catch((err) => captureServerException(err, { tag: "email:pro-unlocked" })),

			isStreakMilestone &&
				resend.emails
					.send({
						from: env.EMAIL_FROM,
						to: email,
						subject: `${newStreak}-day streak on PSTrack`,
						react: StreakMilestoneEmail({ name, streak: newStreak, dashboardUrl }),
					})
					.catch((err) => captureServerException(err, { tag: "email:streak-milestone" })),

			...newBadges.map((badgeType) =>
				resend.emails
					.send({
						from: env.EMAIL_FROM,
						to: email,
						subject: `New badge on PSTrack`,
						react: BadgeEarnedEmail({ name, badgeType, dashboardUrl }),
					})
					.catch((err) => captureServerException(err, { tag: "email:badge-earned" }))
			),
		])
	},

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
