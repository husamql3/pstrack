import { SolveStatus } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { USERNAME_COOLDOWN_MS } from "./users.constants"
import {
	type HeatmapDay,
	type MeResponse,
	meSelect,
	PRO_THRESHOLD,
	type PublicProfileResponse,
	publicProfileSelect,
} from "./users.type"

type UpdateProfileInput = Partial<{
	name: string
	bio: string | null
	twitterHandle: string | null
	linkedinHandle: string | null
	websiteUrl: string | null
	isPublic: boolean
}>

type UpdateHandlesInput = {
	leetcodeHandle: string
	codeforcesHandle: string | null
}

type UpdateNotificationsInput = {
	notifyDailyProblem: boolean
	notifyAchievements: boolean
	notifyGroupActivity: boolean
}

const computeNextUsernameChangeAt = (changedAt: Date | null): Date | null => {
	if (!changedAt) return null
	const next = new Date(changedAt.getTime() + USERNAME_COOLDOWN_MS)
	return next.getTime() > Date.now() ? next : null
}

export const usersDao = {
	findByUsername: async (username: string) =>
		db.user.findUnique({
			where: { username: username.toLowerCase() },
			select: { id: true },
		}),

	findMe: async (userId: string): Promise<MeResponse | null> => {
		const user = await db.user.findUnique({
			where: { id: userId },
			select: meSelect,
		})
		if (!user) return null
		const pauseLimit = user.isPro ? 4 : 2
		return {
			...user,
			usernameNextChangeAt: computeNextUsernameChangeAt(user.usernameChangedAt),
			pausesRemainingThisMonth: Math.max(0, pauseLimit - user.pausesUsedThisMonth),
			verificationFailuresRemainingThisMonth:
				user.verificationFailuresThisMonth >= 1 ? 0 : 1,
			pointsToProUnlock: user.isPro ? 0 : Math.max(0, PRO_THRESHOLD - user.totalPoints),
		}
	},

	findPublicProfile: async (username: string): Promise<PublicProfileResponse | null> => {
		const user = await db.user.findUnique({
			where: { username: username.toLowerCase() },
			select: publicProfileSelect,
		})
		if (!user) return null
		if (!user.isPublic) {
			return {
				visibility: "PRIVATE",
				username: user.username ?? username,
				name: user.name,
				isPro: user.isPro,
			}
		}
		return { visibility: "PUBLIC", ...user }
	},

	updateUsername: async (
		userId: string,
		username: string
	): Promise<
		| { error: "TAKEN" }
		| { error: "COOLDOWN"; nextChangeAt: Date }
		| { error: null; me: MeResponse }
	> => {
		const normalized = username.toLowerCase()

		const current = await db.user.findUnique({
			where: { id: userId },
			select: { username: true, usernameChangedAt: true },
		})
		if (!current) return { error: "TAKEN" }

		if (current.username === normalized) {
			const me = await usersDao.findMe(userId)
			if (!me) return { error: "TAKEN" }
			return { error: null, me }
		}

		const nextChangeAt = computeNextUsernameChangeAt(current.usernameChangedAt)
		if (nextChangeAt) return { error: "COOLDOWN", nextChangeAt }

		const existing = await db.user.findUnique({
			where: { username: normalized },
			select: { id: true },
		})
		if (existing && existing.id !== userId) return { error: "TAKEN" }

		await db.user.update({
			where: { id: userId },
			data: { username: normalized, usernameChangedAt: new Date() },
		})
		const me = await usersDao.findMe(userId)
		if (!me) return { error: "TAKEN" }
		return { error: null, me }
	},

	updateProfile: async (
		userId: string,
		input: UpdateProfileInput
	): Promise<MeResponse> => {
		await db.user.update({ where: { id: userId }, data: input })
		const me = await usersDao.findMe(userId)
		if (!me) throw new Error("User vanished after profile update")
		return me
	},

	updateHandles: async (
		userId: string,
		input: UpdateHandlesInput
	): Promise<MeResponse> => {
		await db.user.update({ where: { id: userId }, data: input })
		const me = await usersDao.findMe(userId)
		if (!me) throw new Error("User vanished after handles update")
		return me
	},

	updateNotifications: async (
		userId: string,
		input: UpdateNotificationsInput
	): Promise<MeResponse> => {
		await db.user.update({ where: { id: userId }, data: input })
		const me = await usersDao.findMe(userId)
		if (!me) throw new Error("User vanished after notifications update")
		return me
	},

	count: async (): Promise<number> => db.user.count(),

	findHeatmap: async (username: string): Promise<HeatmapDay[] | null> => {
		const user = await db.user.findUnique({
			where: { username: username.toLowerCase() },
			select: { id: true, isPublic: true },
		})
		if (!user?.isPublic) return null

		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const startDate = new Date(today)
		startDate.setDate(today.getDate() - 363)

		const solves = await db.userSolve.findMany({
			where: {
				userId: user.id,
				status: SolveStatus.SOLVED,
				dailyProblem: { assignedDate: { gte: startDate } },
			},
			select: { dailyProblem: { select: { assignedDate: true } } },
		})

		const solvedDates = new Set(
			solves.map((s) => s.dailyProblem.assignedDate.toISOString().split("T")[0])
		)

		const days: HeatmapDay[] = []
		for (let i = 363; i >= 0; i--) {
			const d = new Date(today)
			d.setDate(today.getDate() - i)
			const dateStr = d.toISOString().split("T")[0] as string
			const solved = solvedDates.has(dateStr)
			days.push({ date: dateStr, count: solved ? 1 : 0, level: solved ? 1 : 0 })
		}

		return days
	},
}
