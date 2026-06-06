import type { Prisma } from "@/generated/prisma/client"
import { db } from "@/server/lib/db"
import {
	type AdminStatsResponse,
	type FeatureFlagResponse,
	featureFlagSelect,
	type SystemConfigResponse,
	systemConfigSelect,
} from "./admin.type"
import { adminAuditDao } from "./admin-audit.dao"

const startOfDayUtc = (d: Date) => {
	const out = new Date(d)
	out.setUTCHours(0, 0, 0, 0)
	return out
}

const formatDateUtc = (d: Date) => d.toISOString().slice(0, 10)

// ─── Stats (60s in-memory cache) ──────────────────────────────────────────────

const STATS_TTL_MS = 60_000
let statsCache: { fetchedAt: number; value: AdminStatsResponse } | null = null

const computeStats = async (): Promise<AdminStatsResponse> => {
	const now = new Date()
	const today = startOfDayUtc(now)
	const sevenDaysAgo = new Date(today)
	sevenDaysAgo.setUTCDate(today.getUTCDate() - 6)
	const thirtyDaysAgo = new Date(today)
	thirtyDaysAgo.setUTCDate(today.getUTCDate() - 29)

	const [users, activeUsers7d, groups, solvesToday, proUsers, signupsToday, signupRows] =
		await Promise.all([
			db.user.count(),
			db.userSolve.findMany({
				where: { verifiedAt: { gte: sevenDaysAgo }, status: "SOLVED" },
				distinct: ["userId"],
				select: { userId: true },
			}),
			db.group.count({ where: { isActive: true } }),
			db.userSolve.count({
				where: { verifiedAt: { gte: today }, status: "SOLVED" },
			}),
			db.user.count({ where: { isPro: true } }),
			db.user.count({ where: { createdAt: { gte: today } } }),
			db.user.findMany({
				where: { createdAt: { gte: thirtyDaysAgo } },
				select: { createdAt: true },
			}),
		])

	const signupBuckets = new Map<string, number>()
	for (let i = 0; i < 30; i++) {
		const d = new Date(thirtyDaysAgo)
		d.setUTCDate(thirtyDaysAgo.getUTCDate() + i)
		signupBuckets.set(formatDateUtc(d), 0)
	}
	for (const row of signupRows) {
		const key = formatDateUtc(row.createdAt)
		const cur = signupBuckets.get(key)
		if (cur !== undefined) signupBuckets.set(key, cur + 1)
	}

	return {
		totals: {
			users,
			activeUsers7d: activeUsers7d.length,
			groups,
			solvesToday,
			proUsers,
			signupsToday,
		},
		signups30d: [...signupBuckets.entries()].map(([date, count]) => ({ date, count })),
	}
}

// ─── Feature flag cache (30s TTL, reset on write) ─────────────────────────────

const FEATURE_FLAG_TTL_MS = 30_000
let featureFlagCache: { fetchedAt: number; value: Map<string, boolean> } | null = null

const loadFeatureFlagMap = async () => {
	const rows = await db.featureFlag.findMany({ select: { key: true, enabled: true } })
	const map = new Map<string, boolean>()
	for (const row of rows) map.set(row.key, row.enabled)
	featureFlagCache = { fetchedAt: Date.now(), value: map }
	return map
}

const invalidateFeatureFlagCache = () => {
	featureFlagCache = null
}

// ─── adminDao ─────────────────────────────────────────────────────────────────

export const adminDao = {
	getStats: async (): Promise<AdminStatsResponse> => {
		if (statsCache && Date.now() - statsCache.fetchedAt < STATS_TTL_MS) {
			return statsCache.value
		}
		const value = await computeStats()
		statsCache = { fetchedAt: Date.now(), value }
		return value
	},
	invalidateStats: () => {
		statsCache = null
	},

	// Feature flags
	listFeatureFlags: async (): Promise<FeatureFlagResponse[]> => {
		return db.featureFlag.findMany({
			select: featureFlagSelect,
			orderBy: { key: "asc" },
		})
	},
	isFeatureEnabled: async (key: string): Promise<boolean> => {
		if (
			!featureFlagCache ||
			Date.now() - featureFlagCache.fetchedAt > FEATURE_FLAG_TTL_MS
		) {
			await loadFeatureFlagMap()
		}
		return featureFlagCache?.value.get(key) ?? false
	},
	toggleFeatureFlag: async (
		adminId: string,
		key: string,
		enabled: boolean
	): Promise<FeatureFlagResponse> => {
		const row = await db.$transaction(async (tx) => {
			const result = await tx.featureFlag.update({
				where: { key },
				data: { enabled },
				select: featureFlagSelect,
			})
			await adminAuditDao.log(
				{
					adminId,
					action: "FEATURE_FLAG_TOGGLED",
					target: { type: "FEATURE_FLAG", id: key },
					metadata: { key, enabled },
				},
				tx
			)
			return result
		})
		invalidateFeatureFlagCache()
		return row
	},
	createFeatureFlag: async (
		adminId: string,
		input: { key: string; enabled: boolean; description: string | null }
	): Promise<FeatureFlagResponse> => {
		const row = await db.$transaction(async (tx) => {
			const result = await tx.featureFlag.create({
				data: input,
				select: featureFlagSelect,
			})
			await adminAuditDao.log(
				{
					adminId,
					action: "FEATURE_FLAG_TOGGLED",
					target: { type: "FEATURE_FLAG", id: input.key },
					metadata: { key: input.key, enabled: input.enabled, created: true },
				},
				tx
			)
			return result
		})
		invalidateFeatureFlagCache()
		return row
	},

	// System config
	listSystemConfig: async (): Promise<SystemConfigResponse[]> => {
		return db.systemConfig.findMany({
			select: systemConfigSelect,
			orderBy: { key: "asc" },
		})
	},
	getSystemConfig: async (key: string): Promise<SystemConfigResponse | null> => {
		return db.systemConfig.findUnique({
			where: { key },
			select: systemConfigSelect,
		})
	},
	upsertSystemConfig: async (
		adminId: string,
		input: { key: string; value: Prisma.InputJsonValue; description: string | null }
	): Promise<SystemConfigResponse> => {
		return db.$transaction(async (tx) => {
			const row = await tx.systemConfig.upsert({
				where: { key: input.key },
				create: {
					key: input.key,
					value: input.value,
					description: input.description,
				},
				update: {
					value: input.value,
					description: input.description,
				},
				select: systemConfigSelect,
			})
			await adminAuditDao.log(
				{
					adminId,
					action: "SYSTEM_CONFIG_UPDATED",
					target: { type: "SYSTEM_CONFIG", id: input.key },
					metadata: { key: input.key },
				},
				tx
			)
			return row
		})
	},
}
