import { logger, schedules } from "@trigger.dev/sdk/v3"

import { ProSource } from "@/generated/prisma/enums"
import { notifyAdmin } from "@/server/lib/bot"
import { db } from "@/server/lib/db"

export const expireAdminProGrantsTask = schedules.task({
	id: "expire-admin-pro-grants",
	cron: "10 0 * * *", // daily, just past midnight UTC
	maxDuration: 120,
	catchError: async ({ task, error, retryAt }) => {
		if (!retryAt) {
			notifyAdmin("job.failed", {
				jobName: task,
				error: error instanceof Error ? error.message : String(error),
				failedAt: new Date().toISOString(),
			})
		}
	},
	run: async () => {
		const now = new Date()

		const expired = await db.user.findMany({
			where: {
				isPro: true,
				proSource: ProSource.ADMIN_GRANT,
				proExpiresAt: { lt: now },
			},
			select: { id: true, username: true },
		})

		if (expired.length === 0) {
			logger.log("No admin-granted Pro to expire")
			return { expired: 0 }
		}

		const ids = expired.map((u) => u.id)

		await db.user.updateMany({
			where: { id: { in: ids } },
			data: { isPro: false, proExpiresAt: null, proSource: null },
		})

		logger.log("Expired admin Pro grants", {
			count: expired.length,
			usernames: expired.map((u) => u.username).filter(Boolean),
		})

		await notifyAdmin("pro.expired", {
			count: expired.length,
			username: expired.length === 1 ? (expired[0]?.username ?? undefined) : undefined,
			source: "admin_grant",
			expiredAt: new Date().toISOString(),
		})

		return { expired: expired.length }
	},
})
