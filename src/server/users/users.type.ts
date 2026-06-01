import { z } from "zod"

import type { Prisma } from "@/generated/prisma/client"
import { PRO_THRESHOLD } from "@/server/points/points.type"
import {
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
	USERNAME_REGEX,
} from "./users.constants"

// ─── Onboarding (existing) ────────────────────────────────────────────────────

export interface ProfileUpdateInput {
	username: string
	leetcodeHandle: string
	codeforcesHandle?: string
}

// ─── Current user (GET /users/me) ─────────────────────────────────────────────

export const meSelect = {
	id: true,
	name: true,
	email: true,
	emailVerified: true,
	username: true,
	leetcodeHandle: true,
	codeforcesHandle: true,
	bio: true,
	twitterHandle: true,
	linkedinHandle: true,
	websiteUrl: true,
	isPublic: true,
	isPro: true,
	proSource: true,
	totalPoints: true,
	currentStreak: true,
	longestStreak: true,
	pausesUsedThisMonth: true,
	verificationFailuresThisMonth: true,
	notifyDailyProblem: true,
	notifyAchievements: true,
	notifyGroupActivity: true,
	usernameChangedAt: true,
	createdAt: true,
} satisfies Prisma.UserSelect

type MeBase = Prisma.UserGetPayload<{ select: typeof meSelect }>

export type MeResponse = MeBase & {
	usernameNextChangeAt: Date | null
	pausesRemainingThisMonth: number
	verificationFailuresRemainingThisMonth: number
	pointsToProUnlock: number
}

export { PRO_THRESHOLD }

// ─── Public profile (GET /users/:username) ────────────────────────────────────

export const publicProfileSelect = {
	id: true,
	name: true,
	username: true,
	bio: true,
	leetcodeHandle: true,
	codeforcesHandle: true,
	twitterHandle: true,
	linkedinHandle: true,
	websiteUrl: true,
	isPublic: true,
	isPro: true,
	createdAt: true,
	badges: {
		select: { type: true, earnedAt: true },
		orderBy: [{ earnedAt: "asc" as const }],
	},
} satisfies Prisma.UserSelect

type PublicProfileBase = Prisma.UserGetPayload<{ select: typeof publicProfileSelect }>

export type PublicProfileResponse =
	| ({ visibility: "PUBLIC" } & PublicProfileBase)
	| {
			visibility: "PRIVATE"
			username: string
			name: string
			isPro: boolean
	  }

// ─── Sessions ─────────────────────────────────────────────────────────────────

export type SessionResponse = {
	id: string
	createdAt: Date
	updatedAt: Date
	expiresAt: Date
	ipAddress: string | null
	userAgent: string | null
	isCurrent: boolean
}

// ─── Profile form schema (client) ─────────────────────────────────────────────

const optionalString = (max: number) =>
	z
		.string()
		.trim()
		.max(max)
		.transform((s) => (s.length === 0 ? null : s))
		.nullable()

export const profileFormSchema = z.object({
	name: z.string().trim().min(1, { error: "Display name is required" }).max(80),
	bio: optionalString(280),
	twitterHandle: optionalString(40),
	linkedinHandle: optionalString(80),
	websiteUrl: optionalString(200),
	isPublic: z.boolean(),
})

export type ProfileFormInput = z.infer<typeof profileFormSchema>

export const usernameFormSchema = z.object({
	username: z
		.string()
		.trim()
		.toLowerCase()
		.min(USERNAME_MIN_LENGTH, { error: `At least ${USERNAME_MIN_LENGTH} characters` })
		.max(USERNAME_MAX_LENGTH, { error: `At most ${USERNAME_MAX_LENGTH} characters` })
		.regex(USERNAME_REGEX, { error: "Only lowercase letters, numbers, _ and -" }),
})

export type UsernameFormInput = z.infer<typeof usernameFormSchema>

export const handlesFormSchema = z.object({
	leetcodeHandle: z.string().trim().min(1, { error: "LeetCode handle is required" }),
	codeforcesHandle: optionalString(50),
})

export type HandlesFormInput = z.infer<typeof handlesFormSchema>

export const notificationsFormSchema = z.object({
	notifyDailyProblem: z.boolean(),
	notifyAchievements: z.boolean(),
	notifyGroupActivity: z.boolean(),
})

export type NotificationsFormInput = z.infer<typeof notificationsFormSchema>

export const emailFormSchema = z.object({
	email: z.string().trim().email({ error: "Invalid email address" }),
})

export type EmailFormInput = z.infer<typeof emailFormSchema>
