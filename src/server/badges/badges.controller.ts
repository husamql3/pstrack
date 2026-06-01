import { Elysia } from "elysia"

import { db } from "@/server/lib/db"
import { requireSessionUser } from "@/server/lib/session"
import { badgesDao } from "./badges.dao"
import type { UserBadgesResponse } from "./badges.type"

export const badgesController = new Elysia({ tags: ["Badges"] }).get(
	"/badges/me",
	async ({ request }) => {
		const { user, response } = await requireSessionUser(request)
		if (!user) return response

		const [earned, progress] = await Promise.all([
			db.userBadge.findMany({
				where: { userId: user.id },
				select: { type: true, earnedAt: true },
				orderBy: { earnedAt: "asc" },
			}),
			badgesDao.computeProgress(user.id),
		])

		return { earned, progress } satisfies UserBadgesResponse
	}
)
