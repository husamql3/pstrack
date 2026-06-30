import { GroupMemberStatus, PointReason } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import type {
	GlobalLeaderboardResponse,
	GroupLeaderboardResponse,
	LeaderboardEntry,
	LeaderboardPeriod,
} from "./leaderboard.type"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EARN_REASONS: PointReason[] = [
	PointReason.DAILY_SOLVE,
	PointReason.FIRST_IN_GROUP,
	PointReason.STREAK_MULTIPLIER_BONUS,
	PointReason.COMEBACK,
	PointReason.EARLY_BIRD,
]

const periodStart = (period: LeaderboardPeriod): Date | null => {
	if (period === "alltime") return null
	const now = new Date()
	if (period === "week") {
		const d = new Date(
			Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
		)
		d.setUTCDate(d.getUTCDate() - d.getUTCDay())
		return d
	}
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

function rankEntries(
	rows: {
		userId: string
		username: string | null
		name: string
		isPro: boolean
		currentStreak: number
		totalPoints: number
		periodPoints: number
	}[]
): LeaderboardEntry[] {
	return rows
		.sort((a, b) => b.periodPoints - a.periodPoints)
		.map((row, i) => ({ rank: i + 1, ...row }))
}

// ─── DAO ──────────────────────────────────────────────────────────────────────

export const leaderboardDao = {
	getGroupLeaderboard: async (
		groupId: string,
		period: LeaderboardPeriod
	): Promise<GroupLeaderboardResponse | null> => {
		const group = await db.group.findUnique({
			where: { id: groupId },
			select: {
				id: true,
				slug: true,
				_count: { select: { members: { where: { status: GroupMemberStatus.ACTIVE } } } },
			},
		})
		if (!group) return null

		const members = await db.groupMember.findMany({
			where: { groupId, status: GroupMemberStatus.ACTIVE },
			select: {
				user: {
					select: {
						id: true,
						username: true,
						name: true,
						isPro: true,
						currentStreak: true,
						totalPoints: true,
					},
				},
			},
		})

		const start = periodStart(period)

		const rows = await Promise.all(
			members.map(async ({ user }) => {
				let periodPoints: number

				if (period === "alltime" || !start) {
					// Use the denormalized total directly for all-time
					periodPoints = user.totalPoints
				} else {
					// groupId is null on solve points — sum by userId + period only
					const agg = await db.pointsHistory.aggregate({
						where: {
							userId: user.id,
							reason: { in: EARN_REASONS },
							createdAt: { gte: start },
						},
						_sum: { delta: true },
					})
					periodPoints = agg._sum.delta ?? 0
				}

				return { userId: user.id, ...user, periodPoints }
			})
		)

		return {
			groupId: group.id,
			groupSlug: group.slug,
			memberCount: group._count.members,
			period,
			entries: rankEntries(rows),
		}
	},

	getGlobalLeaderboard: async (
		period: LeaderboardPeriod
	): Promise<GlobalLeaderboardResponse> => {
		const start = periodStart(period)

		if (period === "alltime") {
			const users = await db.user.findMany({
				where: { banned: false },
				orderBy: { totalPoints: "desc" },
				take: 30,
				select: {
					id: true,
					username: true,
					name: true,
					isPro: true,
					currentStreak: true,
					totalPoints: true,
				},
			})

			const entries: LeaderboardEntry[] = users.map((u, i) => ({
				rank: i + 1,
				userId: u.id,
				username: u.username,
				name: u.name,
				isPro: u.isPro,
				currentStreak: u.currentStreak,
				periodPoints: u.totalPoints,
			}))

			return { period, entries }
		}

		const agg = await db.pointsHistory.groupBy({
			by: ["userId"],
			where: {
				reason: { in: EARN_REASONS },
				createdAt: start ? { gte: start } : undefined,
			},
			_sum: { delta: true },
			orderBy: { _sum: { delta: "desc" } },
			take: 30,
		})

		const userIds = agg.map((r) => r.userId)
		const users = await db.user.findMany({
			where: { id: { in: userIds }, banned: false },
			select: {
				id: true,
				username: true,
				name: true,
				isPro: true,
				currentStreak: true,
				totalPoints: true,
			},
		})
		const userMap = new Map(users.map((u) => [u.id, u]))

		const entries: LeaderboardEntry[] = agg
			.filter((r) => userMap.has(r.userId))
			.map((r, i) => {
				const u = userMap.get(r.userId)
				if (!u) return null
				return {
					rank: i + 1,
					userId: u.id,
					username: u.username,
					name: u.name,
					isPro: u.isPro,
					currentStreak: u.currentStreak,
					periodPoints: r._sum.delta ?? 0,
				}
			})
			.filter((e): e is LeaderboardEntry => e !== null)

		return { period, entries }
	},

	getUserGroups: async (userId: string) => {
		return db.groupMember.findMany({
			where: { userId, status: GroupMemberStatus.ACTIVE },
			select: {
				group: {
					select: { id: true, slug: true },
				},
			},
		})
	},
}
