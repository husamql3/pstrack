import type { Prisma } from "@/generated/prisma/client"
import { PointReason, ProSource } from "@/generated/prisma/enums"
import {
	type AdminUserDetailResponse,
	type AdminUserListItem,
	type AdminUserPointsHistoryItem,
	adminUserDetailSelect,
	adminUserListSelect,
	adminUserPointsHistorySelect,
	type PaginatedResponse,
} from "@/server/admin/admin.type"
import { adminAuditDao } from "@/server/admin/admin-audit.dao"
import { db } from "@/server/lib/db"
import { pointsDao } from "@/server/points/points.dao"

type ListParams = {
	cursor?: string | null
	limit: number
	q?: string | null
	role?: "admin" | "user" | null
	isPro?: boolean | null
	banned?: boolean | null
	sortBy?: string | null
	sortDir?: "asc" | "desc"
}

export const usersAdminDao = {
	list: async (params: ListParams): Promise<PaginatedResponse<AdminUserListItem>> => {
		const where: Prisma.UserWhereInput = {}

		if (params.q) {
			const q = params.q.trim()
			if (q.length > 0) {
				where.OR = [
					{ username: { contains: q, mode: "insensitive" } },
					{ name: { contains: q, mode: "insensitive" } },
					{ email: { contains: q, mode: "insensitive" } },
				]
			}
		}
		if (params.role === "admin") where.role = "admin"
		if (params.role === "user") where.role = { not: "admin" }
		if (params.isPro !== null && params.isPro !== undefined) where.isPro = params.isPro
		if (params.banned !== null && params.banned !== undefined)
			where.banned = params.banned

		const sortBy = params.sortBy ?? "createdAt"
		const sortDir = params.sortDir ?? "desc"
		const orderBy: Prisma.UserOrderByWithRelationInput =
			sortBy === "totalPoints"
				? { totalPoints: sortDir }
				: sortBy === "currentStreak"
					? { currentStreak: sortDir }
					: { createdAt: sortDir }

		const rows = await db.user.findMany({
			where,
			select: adminUserListSelect,
			orderBy,
			take: params.limit + 1,
			...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
		})

		const hasMore = rows.length > params.limit
		const items = hasMore ? rows.slice(0, params.limit) : rows
		return {
			items,
			nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
		}
	},

	get: async (id: string): Promise<AdminUserDetailResponse | null> => {
		return db.user.findUnique({
			where: { id },
			select: adminUserDetailSelect,
		})
	},

	pointsHistory: async (
		id: string,
		limit: number,
		cursor: string | null
	): Promise<PaginatedResponse<AdminUserPointsHistoryItem>> => {
		const rows = await db.pointsHistory.findMany({
			where: { userId: id },
			select: adminUserPointsHistorySelect,
			orderBy: { createdAt: "desc" },
			take: limit + 1,
			...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
		})
		const hasMore = rows.length > limit
		const items = hasMore ? rows.slice(0, limit) : rows
		return {
			items,
			nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
		}
	},

	setBan: async (
		adminId: string,
		userId: string,
		banned: boolean,
		reason: string | null
	): Promise<AdminUserDetailResponse> => {
		return db.$transaction(async (tx) => {
			const updated = await tx.user.update({
				where: { id: userId },
				data: {
					banned,
					banReason: banned ? reason : null,
					banExpires: null,
				},
				select: adminUserDetailSelect,
			})
			await adminAuditDao.log(
				{
					adminId,
					action: banned ? "USER_BANNED" : "USER_UNBANNED",
					target: { type: "USER", id: userId },
					metadata: { reason: reason ?? null },
				},
				tx
			)
			return updated
		})
	},

	adjustPoints: async (
		adminId: string,
		userId: string,
		delta: number,
		reason: string
	): Promise<{ newTotal: number }> => {
		return db.$transaction(async (tx) => {
			const result = await pointsDao.applyPointsDelta(
				userId,
				delta,
				PointReason.ADMIN_ADJUSTMENT,
				{ tx, adminNote: reason }
			)
			await adminAuditDao.log(
				{
					adminId,
					action: "POINTS_ADJUSTED",
					target: { type: "USER", id: userId },
					metadata: { delta, reason },
				},
				tx
			)
			return { newTotal: result.newTotal }
		})
	},

	setPro: async (
		adminId: string,
		userId: string,
		input: { grant: boolean; expiresAt: Date | null; reason: string }
	): Promise<
		| { ok: true; user: AdminUserDetailResponse; becamePro: boolean }
		| { ok: false; error: "USER_NOT_FOUND" | "POLAR_PRO_LOCKED" }
	> => {
		const user = await db.user.findUnique({
			where: { id: userId },
			select: { isPro: true, proSource: true },
		})
		if (!user) return { ok: false, error: "USER_NOT_FOUND" }
		if (!input.grant && user.proSource === ProSource.POLAR_PURCHASE) {
			return { ok: false, error: "POLAR_PRO_LOCKED" }
		}

		const updated = await db.$transaction(async (tx) => {
			const next = await tx.user.update({
				where: { id: userId },
				data: input.grant
					? {
							isPro: true,
							proSource: ProSource.ADMIN_GRANT,
							proExpiresAt: input.expiresAt,
						}
					: {
							isPro: false,
							proExpiresAt: null,
						},
				select: adminUserDetailSelect,
			})
			await adminAuditDao.log(
				{
					adminId,
					action: input.grant ? "PRO_GRANTED" : "PRO_REVOKED",
					target: { type: "USER", id: userId },
					metadata: {
						reason: input.reason,
						expiresAt: input.expiresAt?.toISOString() ?? null,
					},
				},
				tx
			)
			return next
		})

		return { ok: true, user: updated, becamePro: input.grant && !user.isPro }
	},
}
