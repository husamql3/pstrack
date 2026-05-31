import { db } from "@/server/lib/db"
import { USERNAME_COOLDOWN_MS } from "./users.constants"
import {
	type MeResponse,
	meSelect,
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
		return {
			...user,
			usernameNextChangeAt: computeNextUsernameChangeAt(user.usernameChangedAt),
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
}
