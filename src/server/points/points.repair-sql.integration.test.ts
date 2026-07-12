import { Pool } from "pg"
import { afterAll, describe, expect, it } from "vitest"

import { PointReason } from "@/generated/prisma/enums"
import { createUser, testDb } from "@/test/db"
import { buildPointRepairSql } from "./points.repair-sql"

const pool = new Pool({
	connectionString:
		process.env.TEST_DATABASE_URL ??
		"postgresql://pstrack:pstrack@127.0.0.1:5433/pstrack?schema=public",
})

afterAll(() => pool.end())

describe("points repair operator SQL", () => {
	it("repairs the cache and records complete aggregate JobRun evidence", async () => {
		const user = await createUser({ totalPoints: 1 })
		await testDb.pointsHistory.create({
			data: {
				userId: user.id,
				delta: 5,
				reason: PointReason.ADMIN_ADJUSTMENT,
			},
		})

		await pool.query(
			buildPointRepairSql({
				expectedMismatches: 1,
				backupSha256: "a".repeat(64),
				runId: "point-repair-test-run",
			})
		)

		await expect(
			testDb.user.findUniqueOrThrow({ where: { id: user.id } })
		).resolves.toMatchObject({ totalPoints: 5 })
		await expect(
			testDb.jobRun.findUniqueOrThrow({
				where: {
					jobName_idempotencyKey: {
						jobName: "repair-points",
						idempotencyKey: "repair-points:aaaaaaaaaaaaaaaa:1",
					},
				},
			})
		).resolves.toMatchObject({
			id: "point-repair-test-run",
			status: "SUCCEEDED",
			result: {
				checkedUsers: 1,
				mismatchedUsers: 1,
				absoluteDrift: 4,
				correctedUsers: 1,
				proGranted: 0,
			},
			updatedAt: expect.any(Date),
		})
	})
})
