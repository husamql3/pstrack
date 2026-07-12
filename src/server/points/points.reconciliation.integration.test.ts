import { describe, expect, it } from "vitest"

import { PointReason, ProSource } from "@/generated/prisma/enums"
import { createUser, testDb } from "@/test/db"
import { auditCachedTotals, repairCachedTotals } from "./points.reconciliation"

const addLedgerEntry = async (userId: string, delta: number, createdAt: Date) =>
	testDb.pointsHistory.create({
		data: {
			userId,
			delta,
			reason: PointReason.ADMIN_ADJUSTMENT,
			createdAt,
		},
	})

describe("points cache reconciliation", () => {
	it("detects drift by replaying the immutable ledger with the zero floor after every entry", async () => {
		const drifted = await createUser({ totalPoints: 2 })
		await addLedgerEntry(drifted.id, -3, new Date("2026-07-01T00:00:00.000Z"))
		await addLedgerEntry(drifted.id, 5, new Date("2026-07-02T00:00:00.000Z"))

		const correctlyFloored = await createUser({ totalPoints: 0 })
		await addLedgerEntry(correctlyFloored.id, -13, new Date("2026-07-01T00:00:00.000Z"))

		await expect(auditCachedTotals()).resolves.toEqual({
			checkedUsers: 2,
			mismatchedUsers: 1,
			absoluteDrift: 3,
			correctedUsers: 0,
			proGranted: 0,
		})

		await expect(
			testDb.user.findUniqueOrThrow({ where: { id: drifted.id } })
		).resolves.toMatchObject({ totalPoints: 2, isPro: false })
	})

	it("transactionally repairs drift, grants threshold Pro, and never revokes Pro", async () => {
		const thresholdCrossing = await createUser({ totalPoints: 2_998 })
		await addLedgerEntry(
			thresholdCrossing.id,
			3_005,
			new Date("2026-07-01T00:00:00.000Z")
		)

		const existingPro = await createUser({
			totalPoints: 25,
			isPro: true,
			proSource: ProSource.POLAR_PURCHASE,
		})
		await addLedgerEntry(existingPro.id, 10, new Date("2026-07-01T00:00:00.000Z"))

		await expect(repairCachedTotals(2)).resolves.toEqual({
			checkedUsers: 2,
			mismatchedUsers: 2,
			absoluteDrift: 22,
			correctedUsers: 2,
			proGranted: 1,
		})

		await expect(
			testDb.user.findUniqueOrThrow({ where: { id: thresholdCrossing.id } })
		).resolves.toMatchObject({
			totalPoints: 3_005,
			isPro: true,
			proSource: ProSource.POINTS_THRESHOLD,
		})
		await expect(
			testDb.user.findUniqueOrThrow({ where: { id: existingPro.id } })
		).resolves.toMatchObject({
			totalPoints: 10,
			isPro: true,
			proSource: ProSource.POLAR_PURCHASE,
		})
	})

	it("refuses to repair when the observed mismatch count differs from the operator precondition", async () => {
		const user = await createUser({ totalPoints: 1 })
		await addLedgerEntry(user.id, 5, new Date("2026-07-01T00:00:00.000Z"))

		await expect(repairCachedTotals(2)).rejects.toThrow(
			"Point repair expected 2 mismatches but found 1"
		)
		await expect(
			testDb.user.findUniqueOrThrow({ where: { id: user.id } })
		).resolves.toMatchObject({ totalPoints: 1 })
	})
})
