import type { Prisma } from "@/generated/prisma/client"
import { PointReason, ProSource } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { MISSED_PENALTY, type PointDriftRow, PRO_THRESHOLD } from "./points.type"

type Tx = Prisma.TransactionClient

type ApplyPointsOptions = {
	groupId?: string
	userSolveId?: string
	adminNote?: string
	tx?: Tx
}

type LockedUserPoints = {
	totalPoints: number
	isPro: boolean
}

const findPointDrift = (tx: Tx): Promise<PointDriftRow[]> =>
	tx.$queryRaw<PointDriftRow[]>`
		WITH RECURSIVE ordered AS (
			SELECT
				p."userId",
				p.delta,
				ROW_NUMBER() OVER (
					PARTITION BY p."userId"
					ORDER BY p."createdAt", p.id
				) AS sequence
			FROM "PointsHistory" p
		), replay AS (
			SELECT
				ordered."userId",
				ordered.sequence,
				GREATEST(0, ordered.delta)::integer AS balance
			FROM ordered
			WHERE ordered.sequence = 1

			UNION ALL

			SELECT
				ordered."userId",
				ordered.sequence,
				GREATEST(0, replay.balance + ordered.delta)::integer AS balance
			FROM replay
			JOIN ordered
				ON ordered."userId" = replay."userId"
				AND ordered.sequence = replay.sequence + 1
		), final_balance AS (
			SELECT DISTINCT ON (replay."userId")
				replay."userId",
				replay.balance
			FROM replay
			ORDER BY replay."userId", replay.sequence DESC
		)
		SELECT
			u.id AS "userId",
			u."totalPoints" AS "currentTotal",
			COALESCE(final_balance.balance, 0)::integer AS "expectedTotal",
			u."isPro" AS "isPro"
		FROM "user" u
		LEFT JOIN final_balance ON final_balance."userId" = u.id
		WHERE u."totalPoints" <> COALESCE(final_balance.balance, 0)
		ORDER BY u.id
	`

const lockUserPoints = async (tx: Tx, userId: string): Promise<LockedUserPoints> => {
	const rows = await tx.$queryRaw<LockedUserPoints[]>`
		SELECT "totalPoints" AS "totalPoints", "isPro" AS "isPro"
		FROM "user"
		WHERE id = ${userId}
		FOR NO KEY UPDATE
	`
	const user = rows[0]
	if (!user) throw new Error(`User not found: ${userId}`)
	return user
}

const applyPointsDeltaInTx = async (
	tx: Tx,
	userId: string,
	delta: number,
	reason: PointReason,
	opts: Omit<ApplyPointsOptions, "tx">
) => {
	const user = await lockUserPoints(tx, userId)

	const created = await tx.pointsHistory.createMany({
		data: {
			userId,
			delta,
			reason,
			groupId: opts.groupId ?? null,
			userSolveId: opts.userSolveId ?? null,
			adminNote: opts.adminNote ?? null,
		},
		skipDuplicates: true,
	})

	if (created.count === 0) {
		return { newTotal: user.totalPoints, crossedProThreshold: false }
	}

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
	countUsers: (tx: Tx): Promise<number> => tx.user.count(),

	findCachedTotalDrift: (tx: Tx): Promise<PointDriftRow[]> => findPointDrift(tx),

	lockAllUserPoints: async (tx: Tx): Promise<void> => {
		await tx.$queryRaw<Array<{ id: string }>>`
			SELECT id FROM "user" ORDER BY id FOR NO KEY UPDATE
		`
	},

	updateCachedTotal: async (
		tx: Tx,
		row: PointDriftRow,
		grantsPro: boolean
	): Promise<void> => {
		await tx.user.update({
			where: { id: row.userId },
			data: {
				totalPoints: row.expectedTotal,
				...(grantsPro && {
					isPro: true,
					proSource: ProSource.POINTS_THRESHOLD,
				}),
			},
		})
	},

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

	applyMissPenalty: async (
		tx: Tx,
		userId: string,
		opts: { userSolveId?: string; streakStartedAt: Date | null }
	): Promise<void> => {
		const solveOpts = { tx, userSolveId: opts.userSolveId }

		if (opts.streakStartedAt) {
			const bonusSum = await pointsDao.sumBonusesSinceStreakStart(
				tx,
				userId,
				opts.streakStartedAt
			)
			if (bonusSum > 0) {
				await pointsDao.applyPointsDelta(
					userId,
					-bonusSum,
					PointReason.CLAWBACK,
					solveOpts
				)
			}
		}

		await pointsDao.applyPointsDelta(
			userId,
			-MISSED_PENALTY,
			PointReason.MISSED_DAY,
			solveOpts
		)

		await tx.user.update({
			where: { id: userId },
			data: { currentStreak: 0, currentStreakStartedAt: null },
		})
	},

	// Per-group miss penalty: the −3 only. Used by the multi-group mark-missed path,
	// where the streak is broken at most once per user (see breakUserStreak) rather
	// than per missed group.
	applyMissPoints: async (
		tx: Tx,
		userId: string,
		opts: { userSolveId?: string; groupId?: string }
	): Promise<void> => {
		await pointsDao.applyPointsDelta(userId, -MISSED_PENALTY, PointReason.MISSED_DAY, {
			tx,
			userSolveId: opts.userSolveId,
			groupId: opts.groupId,
		})
	},

	// Break a user's streak once: claw back streak-scoped bonuses accrued since the
	// streak started, then reset the streak. Called at most once per user per day.
	breakUserStreak: async (
		tx: Tx,
		userId: string,
		streakStartedAt: Date | null
	): Promise<void> => {
		if (streakStartedAt) {
			const bonusSum = await pointsDao.sumBonusesSinceStreakStart(
				tx,
				userId,
				streakStartedAt
			)
			if (bonusSum > 0) {
				await pointsDao.applyPointsDelta(userId, -bonusSum, PointReason.CLAWBACK, { tx })
			}
		}

		await tx.user.update({
			where: { id: userId },
			data: { currentStreak: 0, currentStreakStartedAt: null },
		})
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
