import type { Prisma } from "@/generated/prisma/client"
import { PointReason, ProSource } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { PRO_THRESHOLD } from "./points.type"

type Tx = Prisma.TransactionClient

type ApplyPointsOptions = {
	groupId?: string
	userSolveId?: string
	adminNote?: string
	tx?: Tx
}

const applyPointsDeltaInTx = async (
	tx: Tx,
	userId: string,
	delta: number,
	reason: PointReason,
	opts: Omit<ApplyPointsOptions, "tx">
) => {
	await tx.pointsHistory.create({
		data: {
			userId,
			delta,
			reason,
			groupId: opts.groupId ?? null,
			userSolveId: opts.userSolveId ?? null,
			adminNote: opts.adminNote ?? null,
		},
	})

	const user = await tx.user.findUniqueOrThrow({
		where: { id: userId },
		select: { totalPoints: true, isPro: true },
	})

	const newTotal = Math.max(0, user.totalPoints + delta)
	const crossedProThreshold = !user.isPro && newTotal >= PRO_THRESHOLD

	await tx.user.update({
		where: { id: userId },
		data: {
			totalPoints: newTotal,
			...(crossedProThreshold && {
				isPro: true,
				proSource: ProSource.POINTS_THRESHOLD,
			}),
		},
	})

	return { newTotal, crossedProThreshold }
}

export const pointsDao = {
	applyPointsDelta: async (
		userId: string,
		delta: number,
		reason: PointReason,
		opts: ApplyPointsOptions = {}
	) => {
		const { tx, ...rest } = opts
		if (tx) return applyPointsDeltaInTx(tx, userId, delta, reason, rest)
		return db.$transaction((newTx) =>
			applyPointsDeltaInTx(newTx, userId, delta, reason, rest)
		)
	},

	sumBonusesSinceStreakStart: async (
		tx: Tx,
		userId: string,
		streakStartedAt: Date
	): Promise<number> => {
		const result = await tx.pointsHistory.aggregate({
			where: {
				userId,
				createdAt: { gte: streakStartedAt },
				reason: { in: [PointReason.STREAK_MULTIPLIER_BONUS, PointReason.FIRST_IN_GROUP] },
			},
			_sum: { delta: true },
		})
		return result._sum.delta ?? 0
	},

	hasEverMissed: async (userId: string): Promise<boolean> => {
		const row = await db.pointsHistory.findFirst({
			where: { userId, reason: PointReason.MISSED_DAY },
			select: { id: true },
		})
		return row !== null
	},

	hasEverJoinedGroup: async (
		tx: Tx,
		userId: string,
		groupId: string
	): Promise<boolean> => {
		const row = await tx.pointsHistory.findFirst({
			where: { userId, groupId, reason: PointReason.JOIN_GROUP },
			select: { id: true },
		})
		return row !== null
	},
}
