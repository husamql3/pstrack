import type { Prisma } from "@/generated/prisma/client"
import { LEETCODE_STUDY_PLAN_ROADMAPS } from "./problems.seed"
import type { RoadmapKey } from "./problems.type"

type Tx = Prisma.TransactionClient
type LegacyRoadmapFlag = "neetcode250" | "neetcode150" | "blind75"

type RoadmapCatalogSeed = Omit<
	Prisma.RoadmapCatalogUncheckedCreateInput,
	"id" | "key"
> & {
	id: string
	key: RoadmapKey
}

const catalogIdFor = (key: string) => `roadmap_${key.toLowerCase()}`

const legacyRoadmapCatalogSeed: RoadmapCatalogSeed[] = [
	{
		id: "roadmap_nc250",
		key: "NC250",
		slug: "neetcode-250",
		title: "NeetCode 250",
		description: "Full 250-problem roadmap",
		source: "NEETCODE",
		sortOrder: 10,
	},
	{
		id: "roadmap_nc150",
		key: "NC150",
		slug: "neetcode-150",
		title: "NeetCode 150",
		description: "Core 150 problems",
		source: "NEETCODE",
		sortOrder: 20,
	},
	{
		id: "roadmap_blind75",
		key: "BLIND75",
		slug: "blind-75",
		title: "Blind 75",
		description: "Classic 75 problems",
		source: "NEETCODE",
		sortOrder: 30,
	},
]

const leetcodeRoadmapCatalogSeed: RoadmapCatalogSeed[] = LEETCODE_STUDY_PLAN_ROADMAPS.map(
	({ key, slug, title, description, source, sortOrder }) => ({
		id: catalogIdFor(key),
		key,
		slug,
		title,
		description,
		source,
		sortOrder,
	})
)

const roadmapCatalogSeed: RoadmapCatalogSeed[] = [
	...legacyRoadmapCatalogSeed,
	...leetcodeRoadmapCatalogSeed,
]

const legacyRoadmapFlag = (roadmap: RoadmapKey): LegacyRoadmapFlag | null => {
	switch (roadmap) {
		case "NC250":
			return "neetcode250"
		case "NC150":
			return "neetcode150"
		case "BLIND75":
			return "blind75"
		default:
			return null
	}
}

const seedLeetCodeStudyPlanProblems = async (tx: Tx) => {
	const maxRoadmapIndex = await tx.problem.aggregate({
		_max: { roadmapIndex: true },
	})
	let nextRoadmapIndex = (maxRoadmapIndex._max.roadmapIndex ?? 0) + 1
	const seen = new Set<string>()

	for (const roadmap of LEETCODE_STUDY_PLAN_ROADMAPS) {
		for (const problem of roadmap.problems) {
			if (seen.has(problem.slug)) continue
			seen.add(problem.slug)

			const existing = await tx.problem.findUnique({
				where: { slug: problem.slug },
				select: { id: true },
			})

			if (existing) {
				await tx.problem.update({
					where: { id: existing.id },
					data: {
						title: problem.title,
						difficulty: problem.difficulty,
						leetcodeId: problem.leetcodeId,
						isPremium: problem.isPremium,
					},
				})
				continue
			}

			await tx.problem.create({
				data: {
					slug: problem.slug,
					title: problem.title,
					difficulty: problem.difficulty,
					topic: problem.topic,
					roadmapIndex: nextRoadmapIndex,
					leetcodeId: problem.leetcodeId,
					isPremium: problem.isPremium,
					source: "NEETCODE",
				},
			})
			nextRoadmapIndex++
		}
	}
}

const syncLegacyRoadmapMemberships = async (tx: Tx) => {
	for (const roadmap of legacyRoadmapCatalogSeed) {
		const flag = legacyRoadmapFlag(roadmap.key)
		if (!flag) continue

		const problems = await tx.problem.findMany({
			where: { [flag]: true },
			orderBy: { roadmapIndex: "asc" },
			select: { id: true, topic: true },
		})

		await tx.roadmapProblem.deleteMany({ where: { roadmapId: roadmap.id } })
		await tx.roadmapProblem.createMany({
			data: problems.map((problem, index) => ({
				roadmapId: roadmap.id,
				problemId: problem.id,
				position: index + 1,
				topic: problem.topic,
			})),
			skipDuplicates: true,
		})
	}
}

const syncLeetCodeStudyPlanMemberships = async (tx: Tx) => {
	for (const roadmap of LEETCODE_STUDY_PLAN_ROADMAPS) {
		const slugs = roadmap.problems.map((problem) => problem.slug)
		const problems = await tx.problem.findMany({
			where: { slug: { in: slugs } },
			select: { id: true, slug: true },
		})
		const problemIdBySlug = new Map(problems.map((problem) => [problem.slug, problem.id]))
		const data: Prisma.RoadmapProblemCreateManyInput[] = []

		for (const problem of roadmap.problems) {
			const problemId = problemIdBySlug.get(problem.slug)
			if (!problemId) continue
			data.push({
				roadmapId: catalogIdFor(roadmap.key),
				problemId,
				position: problem.position,
				topic: problem.topic,
			})
		}

		if (data.length !== roadmap.problems.length) {
			throw new Error(`Could not sync all problems for roadmap ${roadmap.key}`)
		}

		await tx.roadmapProblem.deleteMany({
			where: { roadmapId: catalogIdFor(roadmap.key) },
		})
		await tx.roadmapProblem.createMany({ data, skipDuplicates: true })
	}
}

export const syncRoadmapCatalog = async (tx: Tx) => {
	for (const roadmap of roadmapCatalogSeed) {
		await tx.roadmapCatalog.upsert({
			where: { key: roadmap.key },
			create: roadmap,
			update: {
				slug: roadmap.slug,
				title: roadmap.title,
				description: roadmap.description,
				source: roadmap.source,
				sortOrder: roadmap.sortOrder,
				isActive: true,
			},
		})
	}

	await seedLeetCodeStudyPlanProblems(tx)
	await syncLegacyRoadmapMemberships(tx)
	await syncLeetCodeStudyPlanMemberships(tx)
}
