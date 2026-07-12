import { db } from "@/server/lib/db"
import { pointsDao } from "./points.dao"
import {
	type PointDriftRow,
	type PointReconciliationResult,
	PRO_THRESHOLD,
} from "./points.type"

const summarize = (
	checkedUsers: number,
	drift: PointDriftRow[],
	correctedUsers: number,
	proGranted: number
): PointReconciliationResult => ({
	checkedUsers,
	mismatchedUsers: drift.length,
	absoluteDrift: drift.reduce(
		(total, row) => total + Math.abs(row.currentTotal - row.expectedTotal),
		0
	),
	correctedUsers,
	proGranted,
})

export const auditCachedTotals = async (): Promise<PointReconciliationResult> =>
	db.$transaction(
		async (tx) => {
			const [checkedUsers, drift] = await Promise.all([
				pointsDao.countUsers(tx),
				pointsDao.findCachedTotalDrift(tx),
			])
			return summarize(checkedUsers, drift, 0, 0)
		},
		{ isolationLevel: "RepeatableRead" }
	)

export const repairCachedTotals = async (
	expectedMismatches: number
): Promise<PointReconciliationResult> =>
	db.$transaction(
		async (tx) => {
			await pointsDao.lockAllUserPoints(tx)
			const [checkedUsers, drift] = await Promise.all([
				pointsDao.countUsers(tx),
				pointsDao.findCachedTotalDrift(tx),
			])
			if (drift.length !== expectedMismatches) {
				throw new Error(
					`Point repair expected ${expectedMismatches} mismatches but found ${drift.length}`
				)
			}

			let proGranted = 0
			for (const row of drift) {
				const grantsPro = !row.isPro && row.expectedTotal >= PRO_THRESHOLD
				await pointsDao.updateCachedTotal(tx, row, grantsPro)
				if (grantsPro) proGranted++
			}
			return summarize(checkedUsers, drift, drift.length, proGranted)
		},
		{ isolationLevel: "Serializable" }
	)
