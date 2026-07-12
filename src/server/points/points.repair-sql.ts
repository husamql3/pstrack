const pointReplayCte = `
	WITH RECURSIVE ordered AS (
		SELECT p."userId", p.delta,
			ROW_NUMBER() OVER (PARTITION BY p."userId" ORDER BY p."createdAt", p.id) AS sequence
		FROM "PointsHistory" p
	), replay AS (
		SELECT ordered."userId", ordered.sequence, GREATEST(0, ordered.delta)::integer AS balance
		FROM ordered WHERE ordered.sequence = 1
		UNION ALL
		SELECT ordered."userId", ordered.sequence,
			GREATEST(0, replay.balance + ordered.delta)::integer AS balance
		FROM replay JOIN ordered ON ordered."userId" = replay."userId"
			AND ordered.sequence = replay.sequence + 1
	), final_balance AS (
		SELECT DISTINCT ON (replay."userId") replay."userId", replay.balance
		FROM replay ORDER BY replay."userId", replay.sequence DESC
	)
	SELECT u.id AS "userId", u."totalPoints" AS "currentTotal",
		COALESCE(final_balance.balance, 0)::integer AS "expectedTotal", u."isPro" AS "isPro"
	FROM "user" u LEFT JOIN final_balance ON final_balance."userId" = u.id
	WHERE u."totalPoints" <> COALESCE(final_balance.balance, 0)
`

export const buildPointRepairSql = ({
	expectedMismatches,
	backupSha256,
	runId,
}: {
	expectedMismatches: number
	backupSha256: string
	runId: string
}) => {
	const idempotencyKey = `repair-points:${backupSha256.slice(0, 16)}:${expectedMismatches}`
	return `
		BEGIN;
		SELECT id FROM "user" ORDER BY id FOR NO KEY UPDATE;
		CREATE TEMP TABLE point_repair_drift ON COMMIT DROP AS ${pointReplayCte};
		DO $$ BEGIN
			IF (SELECT COUNT(*) FROM point_repair_drift) <> ${expectedMismatches} THEN
				RAISE EXCEPTION 'Point repair expected ${expectedMismatches} mismatches but observed a different count';
			END IF;
		END $$;
		CREATE TEMP TABLE point_repair_summary ON COMMIT DROP AS
		WITH updated AS (
			UPDATE "user" u SET
				"totalPoints" = d."expectedTotal",
				"isPro" = u."isPro" OR (NOT d."isPro" AND d."expectedTotal" >= 3000),
				"proSource" = CASE
					WHEN NOT d."isPro" AND d."expectedTotal" >= 3000
					THEN 'POINTS_THRESHOLD'::"ProSource" ELSE u."proSource" END
			FROM point_repair_drift d WHERE u.id = d."userId"
			RETURNING (NOT d."isPro" AND d."expectedTotal" >= 3000) AS "grantedPro"
		)
		SELECT
			(SELECT COUNT(*)::integer FROM "user") AS "checkedUsers",
			(SELECT COUNT(*)::integer FROM point_repair_drift) AS "mismatchedUsers",
			(SELECT COALESCE(SUM(ABS("currentTotal" - "expectedTotal")), 0)::integer FROM point_repair_drift) AS "absoluteDrift",
			(SELECT COUNT(*)::integer FROM updated) AS "correctedUsers",
			(SELECT COUNT(*)::integer FROM updated WHERE "grantedPro") AS "proGranted";
		INSERT INTO job_run (
			id, "jobName", "idempotencyKey", status, attempts,
			"startedAt", "finishedAt", "updatedAt", result
		)
		SELECT
			'${runId}', 'repair-points', '${idempotencyKey}', 'SUCCEEDED', 1,
			NOW(), NOW(), NOW(), TO_JSONB(s)
		FROM point_repair_summary s;
		SELECT ROW_TO_JSON(s) FROM point_repair_summary s;
		COMMIT;
	`
}
