import BadgeEarnedEmail from "@/emails/badge-earned"
import ProUnlockedByPointsEmail from "@/emails/pro-unlocked-by-points"
import StreakMilestoneEmail from "@/emails/streak-milestone"
import { env } from "@/env"
import { db } from "@/server/lib/db"
import { resend } from "@/server/lib/email"
import { captureServerException } from "@/server/lib/sentry"

const BASE_URL = env.BETTER_AUTH_URL.replace(/\/$/, "")

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
						subject: "You've unlocked Pro on PStrack",
						react: ProUnlockedByPointsEmail({ name, dashboardUrl }),
					})
					.catch((err) => captureServerException(err, { tag: "email:pro-unlocked" })),

			isStreakMilestone &&
				resend.emails
					.send({
						from: env.EMAIL_FROM,
						to: email,
						subject: `${newStreak}-day streak on PStrack`,
						react: StreakMilestoneEmail({ name, streak: newStreak, dashboardUrl }),
					})
					.catch((err) => captureServerException(err, { tag: "email:streak-milestone" })),

			...newBadges.map((badgeType) =>
				resend.emails
					.send({
						from: env.EMAIL_FROM,
						to: email,
						subject: `New badge on PStrack`,
						react: BadgeEarnedEmail({ name, badgeType, dashboardUrl }),
					})
					.catch((err) => captureServerException(err, { tag: "email:badge-earned" }))
			),
		])
	},
}
