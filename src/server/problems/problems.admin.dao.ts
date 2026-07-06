import type { Prisma } from "@/generated/prisma/client"
import {
	type AdminProblemListItem,
	adminProblemListSelect,
	type PaginatedResponse,
} from "@/server/admin/admin.type"
import { adminAuditDao } from "@/server/admin/admin-audit.dao"
import { db } from "@/server/lib/db"
import { problemsDao } from "./problems.dao"

type ListParams = {
	cursor?: string | null
	limit: number
	q?: string | null
	difficulty?: "EASY" | "MEDIUM" | "HARD" | null
	source?: "NEETCODE" | "CUSTOM" | null
	roadmap?: string | null
	sortBy?: string | null
	sortDir?: "asc" | "desc"
}

type CreateInput = {
	slug: string
	title: string
	difficulty: "EASY" | "MEDIUM" | "HARD"
	topic: string
	leetcodeId?: number | null
	neetcode250?: boolean
	neetcode150?: boolean
	blind75?: boolean
}

type UpdateInput = Partial<Omit<CreateInput, "slug">>
type Tx = Prisma.TransactionClient
type RoadmapKey = "NC250" | "NC150" | "BLIND75"
type RoadmapFlag = "neetcode250" | "neetcode150" | "blind75"

const roadmapFlags: Array<{ key: RoadmapKey; flag: RoadmapFlag }> = [
	{ key: "NC250", flag: "neetcode250" },
	{ key: "NC150", flag: "neetcode150" },
	{ key: "BLIND75", flag: "blind75" },
]

const nextRoadmapIndex = async (): Promise<number> => {
	const max = await db.problem.aggregate({ _max: { roadmapIndex: true } })
	return (max._max.roadmapIndex ?? 0) + 1
}

const nextPositionForRoadmap = async (tx: Tx, roadmapId: string): Promise<number> => {
	const max = await tx.roadmapProblem.aggregate({
		where: { roadmapId },
		_max: { position: true },
	})
	return (max._max.position ?? 0) + 1
}

const syncProblemRoadmapMemberships = async (tx: Tx, problem: AdminProblemListItem) => {
	for (const roadmap of roadmapFlags) {
		const catalog = await tx.roadmapCatalog.findUnique({
			where: { key: roadmap.key },
			select: { id: true },
		})
		if (!catalog) continue

		if (problem[roadmap.flag]) {
			const existing = await tx.roadmapProblem.findUnique({
				where: {
					roadmapId_problemId: {
						roadmapId: catalog.id,
						problemId: problem.id,
					},
				},
				select: { position: true },
			})

			await tx.roadmapProblem.upsert({
				where: {
					roadmapId_problemId: {
						roadmapId: catalog.id,
						problemId: problem.id,
					},
				},
				create: {
					roadmapId: catalog.id,
					problemId: problem.id,
					position: existing?.position ?? (await nextPositionForRoadmap(tx, catalog.id)),
					topic: problem.topic,
				},
				update: { topic: problem.topic },
			})
			continue
		}

		await tx.roadmapProblem.deleteMany({
			where: { roadmapId: catalog.id, problemId: problem.id },
		})
	}
}

export const problemsAdminDao = {
	list: async (params: ListParams): Promise<PaginatedResponse<AdminProblemListItem>> => {
		const where: Prisma.ProblemWhereInput = {}

		if (params.q) {
			const q = params.q.trim()
			if (q.length > 0) {
				where.OR = [
					{ slug: { contains: q, mode: "insensitive" } },
					{ title: { contains: q, mode: "insensitive" } },
					{ topic: { contains: q, mode: "insensitive" } },
				]
			}
		}
		if (params.difficulty) where.difficulty = params.difficulty
		if (params.source) where.source = params.source
		if (params.roadmap) {
			where.roadmapMemberships = { some: { roadmap: { key: params.roadmap } } }
		}

		const sortDir = params.sortDir ?? "asc"
		const orderBy: Prisma.ProblemOrderByWithRelationInput =
			params.sortBy === "title"
				? { title: sortDir }
				: params.sortBy === "difficulty"
					? { difficulty: sortDir }
					: { roadmapIndex: sortDir }

		const rows = await db.problem.findMany({
			where,
			select: adminProblemListSelect,
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

	create: async (
		adminId: string,
		input: CreateInput
	): Promise<
		{ ok: true; problem: AdminProblemListItem } | { ok: false; error: "SLUG_TAKEN" }
	> => {
		const existing = await db.problem.findUnique({
			where: { slug: input.slug },
			select: { id: true },
		})
		if (existing) return { ok: false, error: "SLUG_TAKEN" }

		const idx = await nextRoadmapIndex()

		const problem = await db.$transaction(async (tx) => {
			const created = await tx.problem.create({
				data: {
					slug: input.slug,
					title: input.title,
					difficulty: input.difficulty,
					topic: input.topic,
					leetcodeId: input.leetcodeId ?? null,
					neetcode250: input.neetcode250 ?? false,
					neetcode150: input.neetcode150 ?? false,
					blind75: input.blind75 ?? false,
					source: "CUSTOM",
					roadmapIndex: idx,
				},
				select: adminProblemListSelect,
			})
			await syncProblemRoadmapMemberships(tx, created)
			await adminAuditDao.log(
				{
					adminId,
					action: "PROBLEM_CREATED",
					target: { type: "PROBLEM", id: created.id },
					metadata: { slug: created.slug },
				},
				tx
			)
			return created
		})

		return { ok: true, problem }
	},

	update: async (
		adminId: string,
		id: string,
		input: UpdateInput
	): Promise<
		{ ok: true; problem: AdminProblemListItem } | { ok: false; error: "NOT_FOUND" }
	> => {
		const existing = await db.problem.findUnique({
			where: { id },
			select: { id: true, slug: true },
		})
		if (!existing) return { ok: false, error: "NOT_FOUND" }

		const problem = await db.$transaction(async (tx) => {
			const updated = await tx.problem.update({
				where: { id },
				data: input,
				select: adminProblemListSelect,
			})
			await syncProblemRoadmapMemberships(tx, updated)
			await adminAuditDao.log(
				{
					adminId,
					action: "PROBLEM_UPDATED",
					target: { type: "PROBLEM", id },
					metadata: { slug: existing.slug, fields: Object.keys(input) },
				},
				tx
			)
			return updated
		})

		return { ok: true, problem }
	},

	delete: async (
		adminId: string,
		id: string
	): Promise<{ ok: true } | { ok: false; error: "NOT_FOUND" | "HAS_DAILY_PROBLEMS" }> => {
		const existing = await db.problem.findUnique({
			where: { id },
			select: { slug: true, _count: { select: { dailyProblems: true } } },
		})
		if (!existing) return { ok: false, error: "NOT_FOUND" }
		if (existing._count.dailyProblems > 0) {
			return { ok: false, error: "HAS_DAILY_PROBLEMS" }
		}

		await db.$transaction(async (tx) => {
			await tx.problem.delete({ where: { id } })
			await adminAuditDao.log(
				{
					adminId,
					action: "PROBLEM_DELETED",
					target: { type: "PROBLEM", id },
					metadata: { slug: existing.slug },
				},
				tx
			)
		})

		return { ok: true }
	},

	reseed: async (adminId: string) => {
		const result = await problemsDao.seedStarterProblems()
		await adminAuditDao.log({
			adminId,
			action: "PROBLEMS_RESEEDED",
			metadata: { seeded: result.seeded, skipped: result.skipped },
		})
		return result
	},
}
