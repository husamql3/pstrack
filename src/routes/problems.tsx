import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { z } from "zod"

import { AppHeader } from "@/components/app-header"
import { RouteErrorFallback } from "@/components/route-error-fallback"
import { useTodayProblems } from "@/features/dashboard/hooks/use-today-problem"
import { FilterRow } from "@/features/problems/components/filter-row"
import { ProblemList } from "@/features/problems/components/problem-list"
import { ProgressDisplay } from "@/features/problems/components/progress-display"
import { RoadmapTabs } from "@/features/problems/components/roadmap-tabs"
import {
	DEFAULT_ROADMAP_KEY,
	ROADMAP_DESCRIPTIONS,
	ROADMAP_LABELS,
} from "@/features/problems/constants"
import { useRoadmap } from "@/features/problems/hooks/use-roadmap"
import type { DifficultyFilter, StatusFilter } from "@/features/problems/types"
import { groupByTopic } from "@/features/problems/utils"
import { Difficulty, SolveStatus } from "@/generated/prisma/enums"
import { useSession } from "@/lib/auth-client"
import { createSeoHead } from "@/lib/seo"
import type { RoadmapKey } from "@/server/problems/problems.type"

// ─── Search param schema ──────────────────────────────────────────────────────

const searchSchema = z.object({
	roadmap: z.string().optional(),
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

export const Route = createFileRoute("/problems")({
	ssr: true,
	validateSearch: searchSchema,
	component: ProblemsPage,
	errorComponent: ({ error, reset }) => (
		<div className="flex h-screen flex-col">
			<AppHeader />
			<main className="mx-auto min-h-0 w-full flex-1 overflow-y-auto px-8 pt-8 pb-4">
				<RouteErrorFallback error={error} reset={reset} title="Could not load problems" />
			</main>
		</div>
	),
	head: () =>
		createSeoHead({
			title: "NeetCode 250, NeetCode 150 & Blind 75 Problem List",
			description:
				"Browse the complete NeetCode 250, NeetCode 150, and Blind 75 problem lists on PStrack. Track your progress, see solve rates, and start solving with daily accountability.",
			path: "/problems",
		}),
})

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProblemsPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const { roadmap: roadmapParam, difficulty, status, q } = Route.useSearch()
	const { data: session } = useSession()
	const isLoggedIn = !!session?.user

	const { data: todays } = useTodayProblems({ enabled: isLoggedIn })
	// Default the roadmap tab to the user's first (primary) started group's roadmap.
	const readyToday = todays?.find((t) => t.state === "READY")
	const groupRoadmap = readyToday?.state === "READY" ? readyToday.groupRoadmap : undefined

	useEffect(() => {
		if (!roadmapParam && groupRoadmap && groupRoadmap !== DEFAULT_ROADMAP_KEY) {
			void navigate({
				search: (prev) => ({ ...prev, roadmap: groupRoadmap }),
				replace: true,
			})
		}
	}, [roadmapParam, groupRoadmap, navigate])

	const activeRoadmap: RoadmapKey = roadmapParam ?? groupRoadmap ?? DEFAULT_ROADMAP_KEY
	const roadmapQuery = useRoadmap(activeRoadmap)

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
			if (isLoggedIn && status === "solved" && p.status !== SolveStatus.SOLVED)
				return false
			if (isLoggedIn && status === "unsolved" && p.status === SolveStatus.SOLVED)
				return false
			if (searchTrim) {
				const idStr = `#${String(p.leetcodeId).padStart(4, "0")}`
				const hay = `${p.title} ${p.slug} ${p.leetcodeId} ${idStr}`.toLowerCase()
				return hay.includes(searchTrim)
			}
			return true
		})
		return groupByTopic(filtered)
	}, [roadmapQuery.data, difficulty, status, searchTrim, isLoggedIn])

	const progress = useMemo(() => {
		const list = roadmapQuery.data ?? []
		const assignable = list.filter((p) => !p.isPremium)
		const total = assignable.length
		const solved = assignable.filter((p) => p.status === SolveStatus.SOLVED).length
		const percent = total > 0 ? Math.round((solved / total) * 100) : 0
		return { total, solved, percent }
	}, [roadmapQuery.data])

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<div className="flex h-screen flex-col">
			<AppHeader />
			<main className="mx-auto min-h-0 w-full flex-1 overflow-y-auto px-8 pt-8 pb-4">
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
						{isLoggedIn && <ProgressDisplay {...progress} />}
					</div>

					<RoadmapTabs value={activeRoadmap} onChange={handleRoadmapChange} />

					<FilterRow
						initialQuery={q ?? ""}
						difficulty={difficulty}
						status={status}
						onQueryChange={handleQueryChange}
						onDifficultyChange={handleDifficultyChange}
						onStatusChange={handleStatusChange}
						showStatus={isLoggedIn}
					/>

					<div className="pb-12">
						<ProblemList
							key={`problem-list-${difficulty}-${status}-${searchTrim}`}
							grouped={grouped}
							isPending={roadmapQuery.isPending}
							isFetching={roadmapQuery.isFetching && !roadmapQuery.isPending}
						/>
					</div>
				</div>
			</main>
		</div>
	)
}
