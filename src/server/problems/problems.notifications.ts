import BadgeEarnedEmail from "@/emails/badge-earned"
import ProUnlockedByPointsEmail from "@/emails/pro-unlocked-by-points"
import StreakMilestoneEmail from "@/emails/streak-milestone"
import { env } from "@/env"
import { BadgeType } from "@/generated/prisma/enums"
import { notifyAdmin } from "@/server/lib/bot"
import { db } from "@/server/lib/db"
import { sendEmail } from "@/server/lib/email"
import { captureServerException } from "@/server/lib/sentry"

// BETTER_AUTH_URL carries a schema default, but SKIP_ENV_VALIDATION (used by the
// CI test job) bypasses zod defaults — fall back so importing this module, which
// happens transitively in tests, never throws on an undefined value.
const BASE_URL = (env.BETTER_AUTH_URL ?? "https://pstrack.localhost").replace(/\/$/, "")

const STREAK_MILESTONES = [7, 30, 100] as const

// Rare, high-signal badges surfaced to the admin bot in realtime. Common badges
// (STREAK_7/30, SOLVED_*, FIRST_SOLVER_1/10, CONSISTENT_30) are intentionally
// left to roll into the daily digest, per AgDR-0001's curation principle.
const NOTABLE_BADGES = new Set<string>([
	BadgeType.STREAK_100,
	BadgeType.STREAK_365,
	BadgeType.FIRST_SOLVER_50,
	BadgeType.NC250_COMPLETE,
	BadgeType.NC150_COMPLETE,
	BadgeType.BLIND75_COMPLETE,
])

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

		// Admin-bot pings fire regardless of the user's own notification prefs —
		// this is an operator observability channel, not a user-facing email, so
		// it sits ahead of the notifyAchievements opt-out gate below.
		const at = new Date().toISOString()
		if (isStreakMilestone) {
			void notifyAdmin("streak.milestone", { name, streak: newStreak, at })
		}
		const notableBadges = newBadges.filter((badge) => NOTABLE_BADGES.has(badge))
		if (notableBadges.length > 0) {
			void notifyAdmin("badge.earned", { name, badges: notableBadges, at })
		}

		const user = await db.user.findUnique({
			where: { id: userId },
			select: { notifyAchievements: true },
		})
		if (!user?.notifyAchievements) return

		const dashboardUrl = `${BASE_URL}/dashboard`

		await Promise.all([
			crossedProThreshold &&
				sendEmail({
					from: env.EMAIL_FROM,
					to: email,
					subject: "You've unlocked Pro on PStrack",
					react: ProUnlockedByPointsEmail({ name, dashboardUrl }),
				}).catch((err) => captureServerException(err, { tag: "email:pro-unlocked" })),

			isStreakMilestone &&
				sendEmail({
					from: env.EMAIL_FROM,
					to: email,
					subject: `${newStreak}-day streak on PStrack`,
					react: StreakMilestoneEmail({ name, streak: newStreak, dashboardUrl }),
				}).catch((err) => captureServerException(err, { tag: "email:streak-milestone" })),

			...newBadges.map((badgeType) =>
				sendEmail({
					from: env.EMAIL_FROM,
					to: email,
					subject: `New badge on PStrack`,
					react: BadgeEarnedEmail({ name, badgeType, dashboardUrl }),
				}).catch((err) => captureServerException(err, { tag: "email:badge-earned" }))
			),
		])
	},
}
