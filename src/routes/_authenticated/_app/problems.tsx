import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { z } from "zod"

import { useTodayProblem } from "@/features/dashboard/hooks/use-today-problem"
import { FilterRow } from "@/features/problems/components/filter-row"
import { ProblemList } from "@/features/problems/components/problem-list"
import { ProgressDisplay } from "@/features/problems/components/progress-display"
import { RoadmapTabs } from "@/features/problems/components/roadmap-tabs"
import { ROADMAP_DESCRIPTIONS, ROADMAP_LABELS } from "@/features/problems/constants"
import { useRoadmap } from "@/features/problems/hooks/use-roadmap"
import type { DifficultyFilter, StatusFilter } from "@/features/problems/types"
import { groupByTopic } from "@/features/problems/utils"
import { Difficulty, Roadmap, SolveStatus } from "@/generated/prisma/enums"
import type { RoadmapKey } from "@/server/problems/problems.type"

// ─── Search param schema ──────────────────────────────────────────────────────

const searchSchema = z.object({
	roadmap: z.enum(Roadmap).optional(),
	difficulty: z
		.union([z.literal("all"), z.enum(Difficulty)])
		.optional()
		.default("all"),
	status: z.enum(["all", "solved", "unsolved"]).optional().default("all"),
	q: z
		.string()
		.optional()
		.transform((val) => val?.trim().toLowerCase()),
})

export const Route = createFileRoute("/_authenticated/_app/problems")({
	validateSearch: searchSchema,
	component: ProblemsPage,
})

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProblemsPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const { roadmap: roadmapParam, difficulty, status, q } = Route.useSearch()

	const { data: today } = useTodayProblem()
	const groupRoadmap = today?.state === "READY" ? today.groupRoadmap : undefined

	// Redirect to the group's roadmap when first landing without an explicit param
	useEffect(() => {
		if (!roadmapParam && groupRoadmap && groupRoadmap !== Roadmap.NC250) {
			void navigate({
				search: (prev) => ({ ...prev, roadmap: groupRoadmap }),
				replace: true,
			})
		}
	}, [roadmapParam, groupRoadmap, navigate])

	const activeRoadmap: RoadmapKey = roadmapParam ?? groupRoadmap ?? Roadmap.NC250
	const roadmapQuery = useRoadmap(activeRoadmap)

	// filterQuery mirrors the URL `q` param but updates synchronously from
	// FilterRow's debounced callback so client-side filtering doesn't lag
	// behind the URL round-trip.
	const [filterQuery, setFilterQuery] = useState(q ?? "")

	const handleRoadmapChange = useCallback(
		(roadmap: RoadmapKey) => navigate({ search: (prev) => ({ ...prev, roadmap }) }),
		[navigate]
	)

	const handleDifficultyChange = useCallback(
		(diff: DifficultyFilter) =>
			navigate({ search: (prev) => ({ ...prev, difficulty: diff }) }),
		[navigate]
	)

	const handleStatusChange = useCallback(
		(s: StatusFilter) => navigate({ search: (prev) => ({ ...prev, status: s }) }),
		[navigate]
	)

	const handleQueryChange = useCallback(
		(term: string) => {
			setFilterQuery(term)
			void navigate({ search: (prev) => ({ ...prev, q: term || undefined }) })
		},
		[navigate]
	)

	// ── Derived data ───────────────────────────────────────────────────────────

	const searchTrim = filterQuery.trim().toLowerCase()

	const grouped = useMemo(() => {
		const list = roadmapQuery.data ?? []
		const filtered = list.filter((p) => {
			if (difficulty !== "all" && p.difficulty !== difficulty) return false
			if (status === "solved" && p.status !== SolveStatus.SOLVED) return false
			if (status === "unsolved" && p.status === SolveStatus.SOLVED) return false
			if (searchTrim) {
				const idStr = `#${String(p.leetcodeId).padStart(4, "0")}`
				const hay = `${p.title} ${p.slug} ${p.leetcodeId} ${idStr}`.toLowerCase()
				return hay.includes(searchTrim)
			}
			return true
		})
		return groupByTopic(filtered)
	}, [roadmapQuery.data, difficulty, status, searchTrim])

	const progress = useMemo(() => {
		const list = roadmapQuery.data ?? []
		const total = list.length
		const solved = list.filter((p) => p.status === SolveStatus.SOLVED).length
		const percent = total > 0 ? Math.round((solved / total) * 100) : 0
		return { total, solved, percent }
	}, [roadmapQuery.data])

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-1">
					<h1 className="font-semibold text-2xl tracking-tight">
						{ROADMAP_LABELS[activeRoadmap]}
					</h1>
					<p className="text-muted-foreground text-sm">
						{ROADMAP_DESCRIPTIONS[activeRoadmap]}
					</p>
				</div>
				<ProgressDisplay {...progress} />
			</div>

			<RoadmapTabs value={activeRoadmap} onChange={handleRoadmapChange} />

			<FilterRow
				initialQuery={q ?? ""}
				difficulty={difficulty}
				status={status}
				onQueryChange={handleQueryChange}
				onDifficultyChange={handleDifficultyChange}
				onStatusChange={handleStatusChange}
			/>

			<div className="pb-12">
				<ProblemList
					grouped={grouped}
					isPending={roadmapQuery.isPending}
					isFetching={roadmapQuery.isFetching && !roadmapQuery.isPending}
				/>
			</div>
		</div>
	)
}
